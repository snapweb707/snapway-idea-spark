import { ArrowRight, Brain, Target, BarChart3, TrendingUp, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { Link } from "react-router-dom";

const About = () => {
  const features = [
    {
      icon: Brain,
      title: "تحليل ذكي بالذكاء الاصطناعي",
      description: "نستخدم أحدث تقنيات الذكاء الاصطناعي لتحليل أفكارك التجارية بدقة عالية"
    },
    {
      icon: Target,
      title: "تحديد الجمهور المستهدف",
      description: "نساعدك في تحديد عملائك المثاليين ووضع استراتيجية دقيقة للوصول إليهم"
    },
    {
      icon: BarChart3,
      title: "تحليل المنافسين",
      description: "دراسة شاملة للسوق والمنافسين لتحديد نقاط القوة والضعف"
    },
    {
      icon: TrendingUp,
      title: "توقعات مالية",
      description: "تقديرات دقيقة للعوائد المتوقعة والتكاليف والنمو المستقبلي"
    }
  ];

  const benefits = [
    "توفير الوقت والجهد في دراسة الجدوى",
    "تحليل شامل وموضوعي للفكرة",
    "تحديد المخاطر والفرص",
    "خطة عمل واضحة ومفصلة",
    "تقييم مالي دقيق",
    "استراتيجية تسويقية فعالة"
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            عن <span className="bg-gradient-primary bg-clip-text text-transparent">Snapway</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            منصة متقدمة لتحليل الأفكار التجارية باستخدام الذكاء الاصطناعي، 
            نساعد رواد الأعمال والمستثمرين في اتخاذ قرارات مدروسة ومبنية على بيانات دقيقة
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-elegant transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6">لماذا تختار Snapway؟</h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <Card className="bg-gradient-primary p-8 text-primary-foreground">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <Star className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl">ابدأ رحلتك التجارية</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6 opacity-90">
                حول فكرتك إلى مشروع ناجح مع تحليل شامل ومدروس
              </p>
              <Link to="/">
                <Button variant="secondary" size="lg" className="w-full group">
                  تحليل فكرتك الآن
                  <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">500+</div>
            <div className="text-muted-foreground">فكرة تم تحليلها</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">95%</div>
            <div className="text-muted-foreground">معدل الدقة</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground">خدمة متواصلة</div>
          </div>
          <div className="p-6">
            <div className="text-3xl font-bold text-primary mb-2">10د</div>
            <div className="text-muted-foreground">متوسط وقت التحليل</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;