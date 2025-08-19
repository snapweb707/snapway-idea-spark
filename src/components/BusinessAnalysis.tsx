import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Target, DollarSign, Users, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";

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
  const { toast } = useToast();

  const analyzeIdea = async () => {
    if (!idea.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال فكرة المشروع",
        variant: "destructive",
      });
      return;
    }

    const apiKey = localStorage.getItem("openai_api_key");
    if (!apiKey) {
      toast({
        title: "مطلوب API Key",
        description: "يرجى إعداد OpenAI API Key من صفحة الإدارة",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a business analyst expert. Analyze the business idea and return a structured JSON response with the following format:
              {
                "overall_score": number (0-100),
                "market_potential": number (0-100), 
                "feasibility": number (0-100),
                "risk_level": number (0-100),
                "strengths": ["strength1", "strength2", ...],
                "weaknesses": ["weakness1", "weakness2", ...],
                "recommendations": ["recommendation1", "recommendation2", ...],
                "market_size": "description of market size",
                "target_audience": "description of target audience",
                "revenue_model": "suggested revenue model",
                "competitive_advantage": "potential competitive advantages"
              }
              
              Respond in Arabic for all text fields. Be comprehensive and provide actionable insights.`
            },
            {
              role: "user",
              content: `حلل فكرة المشروع التالية: ${idea}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل في الحصول على التحليل");
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      try {
        const parsedAnalysis = JSON.parse(analysisText);
        setAnalysis(parsedAnalysis);
        toast({
          title: "تم التحليل بنجاح",
          description: "تم تحليل فكرة المشروع بنجاح",
        });
      } catch (parseError) {
        throw new Error("خطأ في تحليل النتائج");
      }
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
                جاري التحليل...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                تحليل الفكرة
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
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