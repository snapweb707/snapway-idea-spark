import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Package, Globe, Image, BarChart3, ShoppingCart, Star } from "lucide-react";
import Header from "@/components/Header";

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'website': return <Globe className="w-6 h-6" />;
      case 'image': return <Image className="w-6 h-6" />;
      case 'analysis': return <BarChart3 className="w-6 h-6" />;
      default: return <Package className="w-6 h-6" />;
    }
  };

  const getProductTypeName = (type: string) => {
    switch (type) {
      case 'website': return 'مواقع الويب';
      case 'image': return 'الصور';
      case 'analysis': return 'التحليل';
      default: return 'منتج';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">جاري تحميل المنتجات...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <ShoppingCart className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">منتجات الذكاء الاصطناعي</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              اكتشف مجموعة متنوعة من حلول الذكاء الاصطناعي لتلبية احتياجاتك التقنية
            </p>
          </div>

          {products.length === 0 ? (
            <Card className="shadow-elegant border-border/50">
              <CardContent className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد منتجات متاحة</h3>
                <p className="text-muted-foreground">سيتم إضافة المنتجات قريباً</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="shadow-elegant border-border/50 hover:shadow-glow transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                        {getProductTypeIcon(product.type)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getProductTypeName(product.type)}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {product.description}
                    </p>
                    
                    {product.features && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">المميزات:</h4>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(product.features).slice(0, 3).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {String(value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      {product.price ? (
                        <div className="text-lg font-bold text-primary">
                          ${product.price}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          السعر عند الطلب
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm">4.8</span>
                      </div>
                    </div>

                    <Button className="w-full" variant="default">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      طلب المنتج
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card className="shadow-elegant border-border/50 bg-gradient-glow">
            <CardContent className="text-center py-8">
              <h3 className="font-semibold mb-2">هل تحتاج منتج مخصص؟</h3>
              <p className="text-muted-foreground text-sm mb-4">
                نوفر حلول ذكاء اصطناعي مخصصة حسب احتياجاتك
              </p>
              <Button variant="premium">
                تواصل معنا
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Products;