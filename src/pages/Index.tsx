import { Link } from "react-router-dom";
import Header from "@/components/Header";
import BusinessAnalysis from "@/components/BusinessAnalysis";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Brain, TrendingUp, Target, BarChart3, Users, Lightbulb, LogIn, UserPlus } from "lucide-react";
import heroImage from "@/assets/hero-analysis.jpg";

const Index = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      
      {/* Analysis Section - Moved to top */}
      <section id="analysis-section" className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Lightbulb className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">{t('home.analysis.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.analysis.subtitle')}
            </p>
          </div>
          
          <BusinessAnalysis />
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-background/50">
        <div className="absolute inset-0 bg-gradient-glow opacity-30" />
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                {t('home.hero.title')}
                <span className="bg-gradient-primary bg-clip-text text-transparent block">
                  {t('home.hero.titleHighlight')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                {t('home.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {user ? (
                    <Button 
                    variant="hero" 
                    size="lg"
                    onClick={() => document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <BarChart3 className="w-5 h-5" />
                    {t('home.hero.analyze')}
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button variant="hero" size="lg">
                      <LogIn className="w-5 h-5" />
                      {t('home.hero.login')}
                    </Button>
                  </Link>
                )}
                {!user && (
                  <Link to="/auth">
                    <Button variant="premium" size="lg">
                      <UserPlus className="w-5 h-5" />
                      {t('home.hero.signup')}
                    </Button>
                  </Link>
                )}
                {user && (
                  <Link to="/products">
                    <Button variant="premium" size="lg">
                      <Users className="w-5 h-5" />
                      {t('home.hero.products')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-3xl blur-3xl"></div>
              <img 
                src={heroImage}
                alt={t('home.hero.titleHighlight')}
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
            <h2 className="text-3xl font-bold mb-4">{t('home.features.title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-glow hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('home.features.smart.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.features.smart.desc')}
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-glow hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('home.features.comprehensive.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.features.comprehensive.desc')}
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-glow hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('home.features.practical.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.features.practical.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
