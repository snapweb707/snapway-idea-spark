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
import { Settings, Key, Shield, CheckCircle, XCircle, Package, Bot, Plus, Trash2, Edit, Globe, Image, BarChart3, LogOut } from "lucide-react";
import Header from "@/components/Header";

const Admin = () => {
  const navigate = useNavigate();
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [isKeySet, setIsKeySet] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    type: "website",
    price: "",
    features: ""
  });
  const [editingProduct, setEditingProduct] = useState<any>(null);
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
    }
  }, [user, isAdmin, loading, navigate]);

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

  const saveOpenRouterKey = () => {
    if (!openRouterKey.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال OpenRouter API Key",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("openrouter_api_key", openRouterKey);
    setIsKeySet(true);
    toast({
      title: "تم الحفظ",
      description: "تم حفظ OpenRouter API Key بنجاح",
    });
  };

  const removeOpenRouterKey = () => {
    localStorage.removeItem("openrouter_api_key");
    setOpenRouterKey("");
    setIsKeySet(false);
    toast({
      title: "تم الحذف",
      description: "تم حذف OpenRouter API Key",
    });
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
        features: ""
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
      features: product.features ? JSON.stringify(product.features, null, 2) : ""
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
              <h1 className="text-3xl font-bold mb-2">لوحة تحكم الإدارة</h1>
              <p className="text-muted-foreground">
                إدارة شاملة للموقع والمنتجات والذكاء الاصطناعي
              </p>
            </div>
            <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </Button>
          </div>

          <Tabs defaultValue="ai-settings" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai-settings" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                إعدادات الذكاء الاصطناعي
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                إدارة المنتجات
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                نماذج الذكاء الاصطناعي
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
                      <label className="text-sm font-medium">السعر</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">المميزات (JSON)</label>
                      <Textarea
                        placeholder='{"feature1": "value1", "feature2": "value2"}'
                        value={newProduct.features}
                        onChange={(e) => setNewProduct({...newProduct, features: e.target.value})}
                      />
                    </div>
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
                          features: ""
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
                              {product.price && <Badge variant="outline">${product.price}</Badge>}
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
                    نماذج الذكاء الاصطناعي المتاحة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-medium">اختر النموذج الافتراضي</label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نموذج الذكاء الاصطناعي" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.model_id}>
                            {model.name} - {model.provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4">
                    {models.map((model) => (
                      <div key={model.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{model.name}</h4>
                          <Badge variant="secondary">{model.provider}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{model.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Context: {model.context_length?.toLocaleString()} tokens</span>
                          <span>Input: ${model.input_cost}/1K tokens</span>
                          <span>Output: ${model.output_cost}/1K tokens</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Admin;