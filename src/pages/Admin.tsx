import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Key, Shield, CheckCircle, XCircle, Package, Bot, Plus, Trash2, Edit, Globe, Image, BarChart3, LogOut, Target, TrendingUp, Users, UserPlus, UserMinus, Bell, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import NotificationsManagement from "@/components/admin/NotificationsManagement";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { ContactManagement } from "@/components/admin/ContactManagement";
import { useTranslation } from 'react-i18next';

const Admin = () => {
  const navigate = useNavigate();
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [isKeySet, setIsKeySet] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [openRouterModels, setOpenRouterModels] = useState<any[]>([]);
  const [loadingOpenRouterModels, setLoadingOpenRouterModels] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    type: "website",
    price: "",
    features: "",
    url: "",
    is_free: false
  });
  const [newService, setNewService] = useState({
    title: "",
    description: "",
    price: "",
    features: "",
    icon: "BarChart3",
    service_type: "general",
    is_free: false
  });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userAnalyses, setUserAnalyses] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [usageLimits, setUsageLimits] = useState({
    daily_analysis_limit: "5",
    daily_marketing_plan_limit: "2"
  });
  const { toast } = useToast();
  const { user, isAdmin, loading, signOut } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    
    if (!loading && user && !isAdmin) {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية للوصول إلى صفحة الإدارة",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const savedKey = localStorage.getItem("openrouter_api_key");
    if (savedKey) {
      setOpenRouterKey(savedKey);
      setIsKeySet(true);
    }

    if (user && isAdmin) {
      fetchModels();
      fetchProducts();
      fetchServices();
      fetchUsers();
      fetchSelectedModel();
      checkDatabaseApiKey();
      fetchUsageLimits();
      if (isKeySet && openRouterKey) {
        fetchOpenRouterModels();
      }
    }
  }, [user, isAdmin, loading, navigate]);

  const fetchSelectedModel = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'selected_ai_model')
        .single();
      
      if (data?.setting_value) {
        setSelectedModel(data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching selected model:', error);
    }
  };



  const saveSelectedModel = async () => {
    if (!selectedModel) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار نموذج",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('setting_key', 'selected_ai_model')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('admin_settings')
          .update({ 
            setting_value: selectedModel,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'selected_ai_model');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert({
            setting_key: 'selected_ai_model',
            setting_value: selectedModel
          });

        if (error) throw error;
      }

      toast({
        title: "تم الحفظ",
        description: "تم حفظ النموذج المختار بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const checkDatabaseApiKey = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'openrouter_api_key')
        .single();
      
      if (data?.setting_value) {
        setOpenRouterKey(data.setting_value);
        setIsKeySet(true);
        fetchOpenRouterModels(data.setting_value);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
    }
  };

  const fetchOpenRouterModels = async (apiKey?: string) => {
    setLoadingOpenRouterModels(true);
    const keyToUse = apiKey || openRouterKey;
    
    if (!keyToUse) {
      setLoadingOpenRouterModels(false);
      return;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "Authorization": `Bearer ${keyToUse}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sortedModels = data.data.sort((a: any, b: any) => {
          const aIsFree = a.pricing?.prompt === "0" || a.pricing?.prompt === 0;
          const bIsFree = b.pricing?.prompt === "0" || b.pricing?.prompt === 0;
          
          if (aIsFree && !bIsFree) return -1;
          if (!aIsFree && bIsFree) return 1;
          return a.name.localeCompare(b.name);
        });
        
        setOpenRouterModels(sortedModels);
      } else {
        console.error("Failed to fetch OpenRouter models");
        setOpenRouterModels([]);
      }
    } catch (error) {
      console.error("Error fetching OpenRouter models:", error);
      setOpenRouterModels([]);
    } finally {
      setLoadingOpenRouterModels(false);
    }
  };

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserAnalyses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUserAnalyses(data || []);
      setSelectedUserId(userId);
    } catch (error) {
      console.error('Error fetching user analyses:', error);
    }
  };

  const fetchUsageLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['daily_analysis_limit', 'daily_marketing_plan_limit']);
      
      if (error) throw error;
      
      const limits = data?.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {} as any) || {};
      
      setUsageLimits({
        daily_analysis_limit: limits.daily_analysis_limit || "5",
        daily_marketing_plan_limit: limits.daily_marketing_plan_limit || "2"
      });
    } catch (error) {
      console.error('Error fetching usage limits:', error);
    }
  };

  const saveUsageLimits = async () => {
    try {
      // Update both limits
      const updates = [
        {
          setting_key: 'daily_analysis_limit',
          setting_value: usageLimits.daily_analysis_limit,
          is_encrypted: false
        },
        {
          setting_key: 'daily_marketing_plan_limit',
          setting_value: usageLimits.daily_marketing_plan_limit,
          is_encrypted: false
        }
      ];

      for (const update of updates) {
        const { data: existing } = await supabase
          .from('admin_settings')
          .select('id')
          .eq('setting_key', update.setting_key)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('admin_settings')
            .update({ 
              setting_value: update.setting_value,
              updated_at: new Date().toISOString()
            })
            .eq('setting_key', update.setting_key);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('admin_settings')
            .insert(update);

          if (error) throw error;
        }
      }

      toast({
        title: "تم الحفظ",
        description: "تم حفظ حدود الاستخدام بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addAdminByEmail = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: t('loginRequired'),
        description: "يرجى إدخال البريد الإلكتروني",
        variant: "destructive",
      });
      return;
    }

    setIsAddingAdmin(true);

    try {
      const { data, error } = await supabase.rpc('assign_admin_role', {
        target_email: newAdminEmail,
        assigned_by_id: user?.id
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast({
          title: t('adminAdded'),
          description: result.message,
        });
        setNewAdminEmail("");
        fetchUsers();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: t('analysisError'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const removeAdminByEmail = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('remove_admin_role', {
        target_email: email,
        removed_by_id: user?.id
      });

      if (error) throw error;

      const result = data as any;
      if (result.success) {
        toast({
          title: t('adminRemoved'),
          description: result.message,
        });
        fetchUsers();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: t('analysisError'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentIsAdmin })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast({
        title: "تم التحديث",
        description: `تم ${!currentIsAdmin ? 'إضافة' : 'إزالة'} صلاحيات المدير بنجاح`,
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const saveOpenRouterKey = async () => {
    if (!openRouterKey.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال OpenRouter API Key",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: existingKey } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('setting_key', 'openrouter_api_key')
        .single();

      if (existingKey) {
        const { error } = await supabase
          .from('admin_settings')
          .update({ 
            setting_value: openRouterKey,
            is_encrypted: true,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'openrouter_api_key');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert({
            setting_key: 'openrouter_api_key',
            setting_value: openRouterKey,
            is_encrypted: true
          });

        if (error) throw error;
      }

      localStorage.setItem("openrouter_api_key", openRouterKey);
      setIsKeySet(true);
      fetchOpenRouterModels();
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ OpenRouter API Key بنجاح في النظام",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeOpenRouterKey = async () => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ setting_value: '' })
        .eq('setting_key', 'openrouter_api_key');

      if (error) throw error;

      localStorage.removeItem("openrouter_api_key");
      setOpenRouterKey("");
      setIsKeySet(false);
      toast({
        title: "تم الحذف",
        description: "تم حذف OpenRouter API Key من النظام",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    if (!openRouterKey) {
      toast({
        title: "خطأ",
        description: "لا يوجد OpenRouter API Key محفوظ",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
        },
      });

      if (response.ok) {
        toast({
          title: "نجح الاتصال",
          description: "OpenRouter API Key يعمل بشكل صحيح",
        });
      } else {
        throw new Error("فشل في الاتصال");
      }
    } catch (error) {
      toast({
        title: "فشل الاتصال",
        description: "OpenRouter API Key غير صحيح أو منتهي الصلاحية",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveService = async () => {
    if (!newService.title || !newService.description) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const serviceData = {
        ...newService,
        price: newService.price ? parseFloat(newService.price) : null,
        features: newService.features ? JSON.parse(newService.features) : null,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
        
        if (error) throw error;
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث الخدمة بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);
        
        if (error) throw error;
        
        toast({
          title: "تم الإضافة",
          description: "تم إضافة الخدمة بنجاح",
        });
      }

      setNewService({
        title: "",
        description: "",
        price: "",
        features: "",
        icon: "BarChart3",
        service_type: "general",
        is_free: false
      });
      setEditingService(null);
      fetchServices();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "تم الحذف",
        description: "تم حذف الخدمة بنجاح",
      });
      
      fetchServices();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditService = (service: any) => {
    setNewService({
      title: service.title,
      description: service.description,
      price: service.price?.toString() || "",
      features: service.features ? JSON.stringify(service.features, null, 2) : "",
      icon: service.icon || "BarChart3",
      service_type: service.service_type || "general",
      is_free: service.is_free || false
    });
    setEditingService(service);
  };

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.description) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        ...newProduct,
        price: newProduct.price ? parseFloat(newProduct.price) : null,
        features: newProduct.features ? JSON.parse(newProduct.features) : null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        
        toast({
          title: "تم التحديث",
          description: "تم تحديث المنتج بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
        
        toast({
          title: "تم الإضافة",
          description: "تم إضافة المنتج بنجاح",
        });
      }

      setNewProduct({
        name: "",
        description: "",
        type: "website",
        price: "",
        features: "",
        url: "",
        is_free: false
      });
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج بنجاح",
      });
      
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: any) => {
    setNewProduct({
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price?.toString() || "",
      features: product.features ? JSON.stringify(product.features, null, 2) : "",
      url: product.url || "",
      is_free: product.is_free || false
    });
    setEditingProduct(product);
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'website': return <Globe className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'analysis': return <BarChart3 className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'BarChart3': return <BarChart3 className="w-4 h-4" />;
      case 'Target': return <Target className="w-4 h-4" />;
      case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getServiceTypeBadge = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">استشارة</Badge>;
      case 'technical_support':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">دعم فني</Badge>;
      case 'business_plan':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">خطة عمل</Badge>;
      case 'idea_protection':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">حماية فكرة</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">عام</Badge>;
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Settings className="w-8 h-8 text-primary-foreground" />
              </div>
            <h1 className="text-3xl font-bold mb-2">لوحة التحكم</h1>
            <p className="text-muted-foreground">
              إدارة شاملة للموقع والمنتجات والخدمات والذكاء الاصطناعي
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>

          <Tabs defaultValue="ai-settings" className="w-full">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="ai-settings" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                {t('systemSettings')}
              </TabsTrigger>
              <TabsTrigger value="usage-limits" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                حدود الاستخدام
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                الإشعارات
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                المستخدمين
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                التواصل
              </TabsTrigger>
              <TabsTrigger value="admins" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t('userManagement')}
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                {t('services')}
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t('products')}
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                النماذج
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('history')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai-settings" className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    OpenRouter API Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="sk-or-..."
                        value={openRouterKey}
                        onChange={(e) => setOpenRouterKey(e.target.value)}
                        className="flex-1"
                        dir="ltr"
                      />
                      <Button 
                        onClick={saveOpenRouterKey}
                        variant="default"
                      >
                        حفظ
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-glow">
                    {isKeySet ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700">OpenRouter API Key محفوظ</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm text-red-700">لم يتم حفظ OpenRouter API Key</span>
                      </>
                    )}
                  </div>

                  {isKeySet && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={testConnection}
                        disabled={isTestingConnection}
                        variant="premium"
                      >
                        {isTestingConnection ? "جاري الاختبار..." : "اختبار الاتصال"}
                      </Button>
                      <Button
                        onClick={removeOpenRouterKey}
                        variant="destructive"
                      >
                        حذف المفتاح
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50 bg-gradient-glow">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold">كيفية الحصول على OpenRouter API Key</h3>
                    <p className="text-sm text-muted-foreground">
                      1. سجل الدخول إلى openrouter.ai
                      <br />
                      2. اذهب إلى API Keys
                      <br />
                      3. انقر على "Create Key"
                      <br />
                      4. انسخ المفتاح والصقه هنا
                    </p>
                  </div>
                </CardContent>
              </Card>
          </TabsContent>

          {/* Notifications Management Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <NotificationsManagement />
          </TabsContent>

          <TabsContent value="admins" className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    {t('addAdmin')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder={t('email')}
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={addAdminByEmail}
                      disabled={isAddingAdmin || !newAdminEmail.trim()}
                    >
                      {isAddingAdmin ? "جاري الإضافة..." : t('addAdmin')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    أدخل البريد الإلكتروني للمستخدم المراد تعيينه كمدير
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {t('adminList')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {users.filter(user => user.is_admin).map((admin) => (
                      <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{admin.display_name || "غير محدد"}</p>
                            <p className="text-sm text-muted-foreground">البريد الإلكتروني غير متاح</p>
                            <Badge variant="default" className="mt-1">
                              {t('admin_role')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {admin.user_id !== user?.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Note: We need email to remove admin, which we don't have directly
                                // This would need to be implemented with a different approach
                                toast({
                                  title: "تنبيه",
                                  description: "يجب استخدام البريد الإلكتروني لإزالة المدير",
                                  variant: "destructive",
                                });
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserMinus className="w-4 h-4" />
                              {t('removeAdmin')}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {users.filter(user => user.is_admin).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        لا يوجد مديرين في النظام
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    جميع المستخدمين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.is_admin ? 'bg-primary/20' : 'bg-muted'
                          }`}>
                            {user.is_admin ? (
                              <Shield className="w-5 h-5 text-primary" />
                            ) : (
                              <Users className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.display_name || "غير محدد"}</p>
                            <p className="text-sm text-muted-foreground">
                              تاريخ التسجيل: {new Date(user.created_at).toLocaleDateString('ar-EG')}
                            </p>
                            <Badge variant={user.is_admin ? "default" : "secondary"} className="mt-1">
                              {user.is_admin ? t('admin_role') : t('user_role')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchUserAnalyses(user.user_id)}
                          >
                            عرض التحليلات
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">عنوان الخدمة</label>
                      <Input
                        placeholder="عنوان الخدمة"
                        value={newService.title}
                        onChange={(e) => setNewService({...newService, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">أيقونة الخدمة</label>
                      <Select value={newService.icon} onValueChange={(value) => setNewService({...newService, icon: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BarChart3">BarChart3</SelectItem>
                          <SelectItem value="Target">Target</SelectItem>
                          <SelectItem value="TrendingUp">TrendingUp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">نوع الخدمة</label>
                    <Select value={newService.service_type} onValueChange={(value) => setNewService({...newService, service_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">خدمة عامة</SelectItem>
                        <SelectItem value="consultation">استشارة</SelectItem>
                        <SelectItem value="technical_support">دعم فني</SelectItem>
                        <SelectItem value="business_plan">خطة عمل</SelectItem>
                        <SelectItem value="idea_protection">حماية فكرة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">وصف الخدمة</label>
                    <Textarea
                      placeholder="وصف الخدمة"
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">السعر</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newService.price}
                      onChange={(e) => setNewService({...newService, price: e.target.value})}
                      disabled={newService.is_free}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="service_is_free"
                      checked={newService.is_free}
                      onChange={(e) => setNewService({...newService, is_free: e.target.checked, price: e.target.checked ? "" : newService.price})}
                      className="w-4 h-4"
                    />
                    <label htmlFor="service_is_free" className="text-sm font-medium">خدمة مجانية</label>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">المميزات (JSON Array)</label>
                    <Textarea
                      placeholder='["ميزة 1", "ميزة 2", "ميزة 3"]'
                      value={newService.features}
                      onChange={(e) => setNewService({...newService, features: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSaveService}>
                      {editingService ? "تحديث الخدمة" : "إضافة الخدمة"}
                    </Button>
                    {editingService && (
                      <Button variant="outline" onClick={() => {
                        setEditingService(null);
                        setNewService({
                          title: "",
                          description: "",
                          price: "",
                          features: "",
                          icon: "BarChart3",
                          service_type: "general",
                          is_free: false
                        });
                      }}>
                        إلغاء
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle>الخدمات المتاحة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getServiceIcon(service.icon)}
                          <div>
                            <h4 className="font-medium">{service.title}</h4>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {getServiceTypeBadge(service.service_type || 'general')}
                              {service.is_free ? (
                                <Badge variant="outline" className="text-green-600">مجانية</Badge>
                              ) : service.price ? (
                                <Badge variant="outline">${service.price}</Badge>
                              ) : (
                                <Badge variant="outline">السعر عند الطلب</Badge>
                              )}
                              <Badge variant={service.is_active ? "default" : "destructive"}>
                                {service.is_active ? "نشطة" : "غير نشطة"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditService(service)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">اسم المنتج</label>
                      <Input
                        placeholder="اسم المنتج"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">نوع المنتج</label>
                      <Select value={newProduct.type} onValueChange={(value) => setNewProduct({...newProduct, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">مواقع الويب</SelectItem>
                          <SelectItem value="image">الصور</SelectItem>
                          <SelectItem value="analysis">التحليل</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">وصف المنتج</label>
                    <Textarea
                      placeholder="وصف المنتج"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">الرابط</label>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={newProduct.url}
                        onChange={(e) => setNewProduct({...newProduct, url: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">السعر</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        disabled={newProduct.is_free}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_free"
                      checked={newProduct.is_free}
                      onChange={(e) => setNewProduct({...newProduct, is_free: e.target.checked, price: e.target.checked ? "" : newProduct.price})}
                      className="w-4 h-4"
                    />
                    <label htmlFor="is_free" className="text-sm font-medium">منتج مجاني</label>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">المميزات (JSON)</label>
                    <Textarea
                      placeholder='{"feature1": "value1", "feature2": "value2"}'
                      value={newProduct.features}
                      onChange={(e) => setNewProduct({...newProduct, features: e.target.value})}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProduct}>
                      {editingProduct ? "تحديث المنتج" : "إضافة المنتج"}
                    </Button>
                    {editingProduct && (
                      <Button variant="outline" onClick={() => {
                        setEditingProduct(null);
                        setNewProduct({
                          name: "",
                          description: "",
                          type: "website",
                          price: "",
                          features: "",
                          url: "",
                          is_free: false
                        });
                      }}>
                        إلغاء
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle>المنتجات المتاحة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getProductTypeIcon(product.type)}
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{product.type}</Badge>
                              {product.is_free ? (
                                <Badge variant="outline" className="text-green-600">مجاني</Badge>
                              ) : product.price ? (
                                <Badge variant="outline">${product.price}</Badge>
                              ) : (
                                <Badge variant="outline">السعر عند الطلب</Badge>
                              )}
                              {product.url && <Badge variant="outline">يحتوي على رابط</Badge>}
                              <Badge variant={product.is_active ? "default" : "destructive"}>
                                {product.is_active ? "نشط" : "غير نشط"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage-limits" className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    إدارة حدود الاستخدام اليومي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="daily_analysis_limit" className="block text-sm font-medium mb-2">
                          الحد اليومي للتحليلات
                        </label>
                        <Input
                          id="daily_analysis_limit"
                          type="number"
                          min="1"
                          max="100"
                          value={usageLimits.daily_analysis_limit}
                          onChange={(e) => setUsageLimits(prev => ({
                            ...prev,
                            daily_analysis_limit: e.target.value
                          }))}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          عدد التحليلات المسموح بها لكل مستخدم يومياً
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="daily_marketing_plan_limit" className="block text-sm font-medium mb-2">
                          الحد اليومي لخطط التسويق
                        </label>
                        <Input
                          id="daily_marketing_plan_limit"
                          type="number"
                          min="1"
                          max="50"
                          value={usageLimits.daily_marketing_plan_limit}
                          onChange={(e) => setUsageLimits(prev => ({
                            ...prev,
                            daily_marketing_plan_limit: e.target.value
                          }))}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          عدد خطط التسويق المسموح بها لكل مستخدم يومياً
                        </p>
                      </div>

                      <Button 
                        onClick={saveUsageLimits} 
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        حفظ الحدود
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          معاينة الحدود الحالية
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>تحليلات يومية:</span>
                            <Badge variant="outline">{usageLimits.daily_analysis_limit}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>خطط تسويق يومية:</span>
                            <Badge variant="outline">{usageLimits.daily_marketing_plan_limit}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="font-medium text-orange-800 mb-2">ملاحظة مهمة</h4>
                        <p className="text-sm text-orange-700">
                          عند تجاوز المستخدمين للحد المسموح، سيتم توجيههم لصفحة التواصل تلقائياً مع رسالة تفيد بضرورة التواصل لرفع الحد.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    إحصائيات العملاء والمسجلين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">إجمالي المسجلين</p>
                          <p className="text-2xl font-bold text-blue-800">{users.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">التحليلات المنجزة</p>
                          <p className="text-2xl font-bold text-green-800">{userAnalyses.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-purple-600 font-medium">المديرين</p>
                          <p className="text-2xl font-bold text-purple-800">
                            {users.filter(u => u.is_admin).length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">تفاصيل العملاء</h3>
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>لا يوجد عملاء مسجلين حتى الآن</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {users.map((customer) => (
                          <div key={customer.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium">
                                    {customer.display_name || 'عميل غير محدد'}
                                  </h4>
                                  {customer.is_admin && (
                                    <Badge variant="secondary" className="text-xs">مدير</Badge>
                                  )}
                                </div>
                                <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                  <p>معرف المستخدم: {customer.user_id}</p>
                                  <p>تاريخ التسجيل: {new Date(customer.created_at).toLocaleDateString('ar-SA')}</p>
                                  <p>آخر تحديث: {new Date(customer.updated_at).toLocaleDateString('ar-SA')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fetchUserAnalyses(customer.user_id)}
                                  className="text-xs"
                                >
                                  <BarChart3 className="w-4 h-4 mr-1" />
                                  عرض التحليلات
                                </Button>
                              </div>
                            </div>
                            
                            {selectedUserId === customer.user_id && userAnalyses.length > 0 && (
                              <div className="mt-4 p-3 bg-muted/30 rounded border-t">
                                <h5 className="font-medium mb-2">تحليلات العميل ({userAnalyses.length})</h5>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {userAnalyses.slice(0, 3).map((analysis) => (
                                    <div key={analysis.id} className="text-xs p-2 bg-background rounded border">
                                      <p className="font-medium">{analysis.idea_text.substring(0, 50)}...</p>
                                      <p className="text-muted-foreground">
                                        {new Date(analysis.created_at).toLocaleDateString('ar-SA')} - 
                                        {analysis.analysis_type}
                                      </p>
                                    </div>
                                  ))}
                                  {userAnalyses.length > 3 && (
                                    <p className="text-xs text-muted-foreground">
                                      وأكثر من {userAnalyses.length - 3} تحليل آخر...
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <NotificationsManagement />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <UsersManagement />
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <ContactManagement />
            </TabsContent>

            <TabsContent value="models" className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    اختيار النموذج للتحليل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اختر النموذج الافتراضي للتحليل</label>
                    <div className="flex gap-2">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نموذج من OpenRouter" />
                        </SelectTrigger>
                        <SelectContent>
                          {openRouterModels.map((model, index) => {
                            const isFree = model.pricing?.prompt === "0" || model.pricing?.prompt === 0;
                            return (
                              <SelectItem key={model.id || index} value={model.id}>
                                <div className="flex items-center gap-2">
                                  <span>{model.name}</span>
                                  {isFree && <Badge variant="outline" className="text-xs text-green-600">مجاني</Badge>}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button onClick={saveSelectedModel}>
                        حفظ
                      </Button>
                    </div>
                  </div>

                  {selectedModel && (
                    <div className="p-3 bg-gradient-glow rounded-lg">
                      <p className="text-sm text-green-700">
                        النموذج المختار: {openRouterModels.find(m => m.id === selectedModel)?.name || selectedModel}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" />
                    نماذج OpenRouter المتاحة
                    {loadingOpenRouterModels && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isKeySet ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>يرجى إضافة OpenRouter API Key أولاً لعرض النماذج المتاحة</p>
                    </div>
                  ) : loadingOpenRouterModels ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">جاري تحميل النماذج...</p>
                    </div>
                  ) : openRouterModels.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>لم يتم العثور على نماذج</p>
                      <Button 
                        onClick={() => fetchOpenRouterModels()} 
                        variant="outline" 
                        className="mt-2"
                      >
                        إعادة المحاولة
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          تم العثور على {openRouterModels.length} نموذج (مرتبة: المجانية أولاً)
                        </p>
                        <Button 
                          onClick={() => fetchOpenRouterModels()} 
                          variant="outline" 
                          size="sm"
                        >
                          تحديث
                        </Button>
                      </div>
                      
                      <div className="grid gap-4 max-h-96 overflow-y-auto">
                        {openRouterModels.map((model, index) => {
                          const isFree = model.pricing?.prompt === "0" || model.pricing?.prompt === 0;
                          const promptPrice = parseFloat(model.pricing?.prompt || "0");
                          const completionPrice = parseFloat(model.pricing?.completion || "0");
                          
                          return (
                            <div key={model.id || index} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{model.name}</h4>
                                <div className="flex gap-2">
                                  {isFree ? (
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      مجاني
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                                      مدفوع
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    {model.context_length?.toLocaleString() || 'N/A'} tokens
                                  </Badge>
                                </div>
                              </div>
                              
                              {model.description && (
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {model.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Input: ${promptPrice.toFixed(6)}/1M tokens</span>
                                <span>Output: ${completionPrice.toFixed(6)}/1M tokens</span>
                                {model.top_provider && (
                                  <Badge variant="outline" className="text-xs">
                                    {model.top_provider.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="shadow-elegant border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    جميع المستخدمين
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>لا يوجد مستخدمين مسجلين</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {users.map((userProfile) => (
                          <div key={userProfile.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">
                                  {userProfile.display_name || 'مستخدم غير محدد'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  معرف المستخدم: {userProfile.user_id}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  تاريخ التسجيل: {new Date(userProfile.created_at).toLocaleDateString('ar-SA')}
                                </p>
                              </div>
                               <div className="flex items-center gap-2">
                                <Badge variant={userProfile.is_admin ? "default" : "secondary"}>
                                  {userProfile.is_admin ? "مدير" : "مستخدم عادي"}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant={userProfile.is_admin ? "destructive" : "default"}
                                  onClick={() => toggleAdmin(userProfile.user_id, userProfile.is_admin)}
                                >
                                  {userProfile.is_admin ? "إزالة مدير" : "جعل مدير"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => fetchUserAnalyses(userProfile.user_id)}
                                >
                                  التحليلات
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {selectedUserId && userAnalyses.length > 0 && (
                <Card className="shadow-elegant border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      سجل التحليلات للمستخدم
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userAnalyses.map((analysis) => (
                        <div key={analysis.id} className="p-4 border rounded-lg">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">
                                تحليل: {analysis.idea_text.substring(0, 50)}...
                              </h4>
                              <Badge variant="secondary">{analysis.analysis_type}</Badge>
                            </div>
                            {analysis.analysis_result && (
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div className="text-center p-2 bg-gradient-glow rounded">
                                  <span className="font-bold text-lg text-primary">
                                    {analysis.analysis_result.overall_score}%
                                  </span>
                                  <p className="text-xs text-muted-foreground">التقييم العام</p>
                                </div>
                                <div className="text-center p-2 bg-gradient-glow rounded">
                                  <span className="font-bold text-lg text-primary">
                                    {analysis.analysis_result.market_potential}%
                                  </span>
                                  <p className="text-xs text-muted-foreground">إمكانية السوق</p>
                                </div>
                                <div className="text-center p-2 bg-gradient-glow rounded">
                                  <span className="font-bold text-lg text-primary">
                                    {analysis.analysis_result.feasibility}%
                                  </span>
                                  <p className="text-xs text-muted-foreground">قابلية التنفيذ</p>
                                </div>
                                <div className="text-center p-2 bg-gradient-glow rounded">
                                  <span className="font-bold text-lg text-primary">
                                    {analysis.analysis_result.risk_level}%
                                  </span>
                                  <p className="text-xs text-muted-foreground">مستوى المخاطر</p>
                                </div>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              تاريخ التحليل: {new Date(analysis.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;
