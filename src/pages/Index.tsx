import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BusinessAnalysis from "@/components/BusinessAnalysis";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Brain, TrendingUp, Target, BarChart3, Users, Lightbulb, LogIn, UserPlus } from "lucide-react";
import heroImage from "@/assets/hero-analysis.jpg";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-30" />
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                حلل أفكارك التجارية بـ
                <span className="bg-gradient-primary bg-clip-text text-transparent block">
                  الذكاء الاصطناعي
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                احصل على تحليل شامل ومفصل لفكرة مشروعك التجاري باستخدام أحدث تقنيات الذكاء الاصطناعي. 
                اكتشف نقاط القوة والضعف والفرص المتاحة.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {user ? (
                  <Button 
                    variant="hero" 
                    size="lg"
                    onClick={() => document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <BarChart3 className="w-5 h-5" />
                    ابدأ التحليل الآن
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button variant="hero" size="lg">
                      <LogIn className="w-5 h-5" />
                      تسجيل الدخول
                    </Button>
                  </Link>
                )}
                {!user && (
                  <Link to="/auth">
                    <Button variant="premium" size="lg">
                      <UserPlus className="w-5 h-5" />
                      إنشاء حساب
                    </Button>
                  </Link>
                )}
                {user && (
                  <Button variant="premium" size="lg">
                    <Users className="w-5 h-5" />
                    شاهد أمثلة
                  </Button>
                )}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-3xl blur-3xl"></div>
              <img 
                src={heroImage}
                alt="تحليل الأعمال بالذكاء الاصطناعي"
                className="relative w-full h-[400px] object-cover rounded-3xl shadow-elegant"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">مزايا منصة Snapway</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              نوفر لك أدوات متقدمة لتحليل أفكارك التجارية بدقة واحترافية
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-glow hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">تحليل ذكي</h3>
              <p className="text-muted-foreground">
                استخدام أحدث نماذج الذكاء الاصطناعي لتحليل أفكارك بدقة عالية
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-glow hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">تقييم شامل</h3>
              <p className="text-muted-foreground">
                تحليل متعدد الأبعاد يشمل السوق والجدوى والمخاطر والفرص
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-glow hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">توصيات عملية</h3>
              <p className="text-muted-foreground">
                نصائح وتوصيات قابلة للتطبيق لتطوير فكرتك وزيادة فرص نجاحها
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analysis Section */}
      <section id="analysis-section" className="py-16 px-4 bg-background/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Lightbulb className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">حلل فكرتك الآن</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              اشرح فكرة مشروعك واحصل على تحليل مفصل في دقائق
            </p>
          </div>
          
          <BusinessAnalysis />
        </div>
      </section>
    </div>
  );
};

export default Index;
