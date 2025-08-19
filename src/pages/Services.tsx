import { Check, ArrowRight, Zap, Target, BarChart3, TrendingUp, Shield, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { Link } from "react-router-dom";

const Services = () => {
  const services = [
    {
      icon: Zap,
      title: "التحليل السريع",
      description: "تحليل أولي شامل لفكرتك التجارية في دقائق معدودة",
      features: [
        "تقييم أولي للفكرة",
        "تحليل السوق الأساسي",
        "تحديد الجمهور المستهدف",
        "المخاطر الأساسية"
      ],
      price: "مجاني",
      duration: "2-5 دقائق",
      popular: false
    },
    {
      icon: Target,
      title: "التحليل التفاعلي",
      description: "تحليل متقدم مع إمكانية التفاعل والحصول على تفاصيل إضافية",
      features: [
        "تحليل متعمق للسوق",
        "دراسة المنافسين",
        "استراتيجية التسويق",
        "التوقعات المالية",
        "خطة العمل الأولية",
        "تحليل SWOT"
      ],
      price: "19 ر.س",
      duration: "5-10 دقائق",
      popular: true
    },
    {
      icon: BarChart3,
      title: "التحليل العميق",
      description: "تحليل شامل ومفصل مع تقرير مكتوب وتوصيات محددة",
      features: [
        "كل ما في التحليل التفاعلي",
        "تقرير PDF مفصل",
        "دراسة جدوى مالية متقدمة",
        "خطة تسويقية شاملة",
        "تحليل المخاطر المتقدم",
        "توصيات استراتيجية",
        "متابعة لمدة شهر"
      ],
      price: "49 ر.س",
      duration: "10-15 دقيقة",
      popular: false
    }
  ];

  const additionalServices = [
    {
      icon: TrendingUp,
      title: "استشارة شخصية",
      description: "جلسة استشارية مع خبير لمناقشة فكرتك التجارية",
      price: "99 ر.س/ساعة"
    },
    {
      icon: Shield,
      title: "حماية الفكرة",
      description: "خدمات الحماية القانونية وتسجيل العلامة التجارية",
      price: "199 ر.س"
    },
    {
      icon: Rocket,
      title: "تطوير خطة العمل",
      description: "إعداد خطة عمل شاملة جاهزة للمستثمرين",
      price: "299 ر.س"
    }
  ];

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

        {/* Main Services */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`relative bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-elegant transition-all duration-300 ${
                service.popular ? 'ring-2 ring-primary/50 scale-105' : ''
              }`}
            >
              {service.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1">
                    الأكثر شعبية
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <service.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary mb-1">{service.price}</div>
                  <div className="text-sm text-muted-foreground">مدة التحليل: {service.duration}</div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/">
                  <Button 
                    className="w-full group" 
                    variant={service.popular ? "default" : "outline"}
                  >
                    ابدأ التحليل الآن
                    <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

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