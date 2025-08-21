import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Target, DollarSign, Users, AlertTriangle, CheckCircle, BarChart3, LogIn } from "lucide-react";
import AnalysisProgress from "./AnalysisProgress";

interface AnalysisResult {
  overall_score: number;
  market_potential: number;
  feasibility: number;
  risk_level: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  market_size: string;
  target_audience: string;
  revenue_model: string;
  competitive_advantage: string;
}

const BusinessAnalysis = () => {
  const [idea, setIdea] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisType, setAnalysisType] = useState<string>("basic");
  const { toast } = useToast();
  const { user } = useAuth();

  const analyzeIdea = async () => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول أولاً لاستخدام التحليل",
        variant: "destructive",
      });
      return;
    }

    if (!idea.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال فكرة المشروع",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // استخدام edge function
      const { data, error } = await supabase.functions.invoke('analyze-idea', {
        body: {
          idea,
          analysisType,
          userId: user.id
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast({
        title: "تم التحليل بنجاح",
        description: `تم إجراء ${getAnalysisTypeName(analysisType)} بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ في التحليل",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getAnalysisTypeName = (type: string) => {
    switch (type) {
      case 'interactive': return 'التحليل التفاعلي';
      case 'deep': return 'التحليل العميق';
      default: return 'التحليل الأساسي';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-elegant border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="w-6 h-6 text-primary" />
            تحليل فكرة المشروع
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              نوع التحليل
            </label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    تحليل أساسي - سريع وشامل
                  </div>
                </SelectItem>
                <SelectItem value="interactive">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    تحليل تفاعلي - مع أسئلة إضافية
                  </div>
                </SelectItem>
                <SelectItem value="deep">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    تحليل عميق - تفصيلي ومتقدم
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              اشرح فكرة مشروعك بالتفصيل
            </label>
            <Textarea
              placeholder="مثال: أريد إنشاء منصة إلكترونية لتوصيل الطعام المحلي في المدينة، تركز على المطاعم الصغيرة والوجبات المنزلية..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="min-h-[120px] resize-none"
              dir="rtl"
            />
          </div>
          
          {!user ? (
            <Link to="/auth">
              <Button variant="hero" size="lg" className="w-full">
                <LogIn className="w-4 h-4" />
                سجل الدخول لبدء التحليل
              </Button>
            </Link>
          ) : (
            <Button
              onClick={analyzeIdea}
              disabled={isAnalyzing || !idea.trim()}
              variant="hero"
              size="lg"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري {getAnalysisTypeName(analysisType)}...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  بدء {getAnalysisTypeName(analysisType)}
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {isAnalyzing && (
        <AnalysisProgress 
          isAnalyzing={isAnalyzing}
          onComplete={() => {
            // يمكن إضافة منطق إضافي هنا عند انتهاء التحليل
          }}
        />
      )}

      {analysis && !isAnalyzing && (
        <div className="grid gap-6">
          {/* نتائج التحليل الرئيسية */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
                  {analysis.overall_score}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">التقييم العام</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${getScoreColor(analysis.market_potential)}`}>
                  {analysis.market_potential}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">إمكانية السوق</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${getScoreColor(analysis.feasibility)}`}>
                  {analysis.feasibility}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">قابلية التنفيذ</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${getScoreColor(100 - analysis.risk_level)}`}>
                  {analysis.risk_level}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">مستوى المخاطر</p>
              </CardContent>
            </Card>
          </div>

          {/* تفاصيل التحليل */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  نقاط القوة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  نقاط الضعف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* المعلومات التفصيلية */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  الجمهور المستهدف
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis.target_audience}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  حجم السوق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis.market_size}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  نموذج الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis.revenue_model}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  الميزة التنافسية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{analysis.competitive_advantage}</p>
              </CardContent>
            </Card>
          </div>

          {/* التوصيات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                التوصيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gradient-glow rounded-lg">
                    <Badge variant="secondary" className="mt-0.5">
                      {index + 1}
                    </Badge>
                    <p className="text-sm flex-1">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BusinessAnalysis;