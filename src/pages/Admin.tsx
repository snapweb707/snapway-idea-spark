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
import { Settings, Key, Shield, CheckCircle, XCircle, Package, Bot, Plus, Trash2, Edit, Globe, Image, BarChart3, LogOut, Target, TrendingUp, Users } from "lucide-react";
import Header from "@/components/Header";

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
    is_free: false
  });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingService, setEditingService] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userAnalyses, setUserAnalyses] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAdmin, loading, signOut } = useAuth();

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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ai-settings" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                إعدادات الذكاء الاصطناعي
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                إدارة الخدمات
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                إدارة المنتجات
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                اختيار النموذج
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                المستخدمين
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
                            <div className="flex items-center gap-2 mt-1">
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
