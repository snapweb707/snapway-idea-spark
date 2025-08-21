import { useState, useEffect } from "react";
import { Check, ArrowRight, Zap, Target, BarChart3, TrendingUp, Shield, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from 'react-i18next';

const Services = () => {
  const { t } = useTranslation();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Target': return Target;
      case 'TrendingUp': return TrendingUp;
      case 'BarChart3':
      default: return BarChart3;
    }
  };

  const additionalServices = [
    {
      icon: TrendingUp,
      title: t('services.personalConsultation'),
      description: t('services.personalConsultationDesc'),
      price: t('services.personalConsultationPrice')
    },
    {
      icon: Shield,
      title: t('services.ideaProtection'),
      description: t('services.ideaProtectionDesc'),
      price: t('services.ideaProtectionPrice')
    },
    {
      icon: Rocket,
      title: t('services.businessPlanDevelopment'),
      description: t('services.businessPlanDevelopmentDesc'),
      price: t('services.businessPlanDevelopmentPrice')
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('services.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            خدمات <span className="bg-gradient-primary bg-clip-text text-transparent">التحليل</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            اختر الخدمة التي تناسب احتياجاتك وابدأ رحلة تحليل فكرتك التجارية
          </p>
        </div>

        {/* Main Services from Database */}
        {services.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {services.map((service, index) => {
              const IconComponent = getIconComponent(service.icon);
              const isPopular = index === 1; // Make middle service popular
              
              return (
                <Card 
                  key={service.id} 
                  className={`relative bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-elegant transition-all duration-300 ${
                    isPopular ? 'ring-2 ring-primary/50 scale-105' : ''
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1">
                        الأكثر شعبية
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{service.description}</p>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {service.is_free ? "مجاني" : `${service.price} ر.س`}
                      </div>
                    </div>
                    
                    {service.features && (
                      <ul className="space-y-3 mb-8">
                        {service.features.map((feature: string, featureIndex: number) => (
                          <li key={featureIndex} className="flex items-center gap-3">
                            <div className="w-5 h-5 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <Link to="/">
                      <Button 
                        className="w-full group" 
                        variant={isPopular ? "default" : "outline"}
                      >
                        ابدأ التحليل الآن
                        <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Additional Services */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">خدمات إضافية</h2>
            <p className="text-muted-foreground">خدمات متخصصة لدعم رحلتك التجارية</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {additionalServices.map((service, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-elegant transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <service.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <div className="text-xl font-bold text-primary mb-4">{service.price}</div>
                  <Button variant="outline" className="w-full">
                    اطلب الخدمة
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="text-center p-12">
            <h2 className="text-3xl font-bold mb-4">هل تحتاج مساعدة في الاختيار؟</h2>
            <p className="text-xl opacity-90 mb-8">
              تواصل مع فريقنا للحصول على استشارة مجانية حول أفضل خدمة تناسب احتياجاتك
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button variant="secondary" size="lg">
                  تواصل معنا
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  ابدأ بالتحليل المجاني
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Services;