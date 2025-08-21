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
import { Loader2, TrendingUp, Target, DollarSign, Users, AlertTriangle, CheckCircle, BarChart3, LogIn, MessageSquare, Calendar, Lightbulb } from "lucide-react";
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
  financial_analysis?: {
    startup_cost: string;
    monthly_expenses: string;
    break_even_time: string;
    roi_projection: string;
  };
  competitive_analysis?: {
    main_competitors: string[];
    market_differentiation: string;
    barrier_to_entry: string;
  };
  interactive_questions?: string[];
  action_plan?: {
    immediate_steps: string[];
    short_term_goals: string[];
    long_term_vision: string;
  };
}

const BusinessAnalysis = () => {
  const [idea, setIdea] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisType, setAnalysisType] = useState<string>("basic");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isInteractiveMode, setIsInteractiveMode] = useState(false);
  const [isUpdatingAnalysis, setIsUpdatingAnalysis] = useState(false);
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
      const { data, error } = await supabase.functions.invoke('analyze-idea', {
        body: {
          idea,
          analysisType,
          userId: user.id
        }
      });

      console.log('Edge function response:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data && data.analysis && data.success) {
        console.log('Analysis received:', data.analysis);
        setAnalysis(data.analysis);
        
        // إذا كان التحليل تفاعلي، ابدأ الوضع التفاعلي
        if (analysisType === 'interactive' && data.analysis.interactive_questions?.length > 0) {
          setIsInteractiveMode(true);
          setCurrentQuestionIndex(0);
          setUserAnswers([]);
        }
        
        toast({
          title: "تم التحليل بنجاح",
          description: "تم إجراء التحليل بنجاح وإنشاء التوصيات",
        });
      } else {
        console.error('Invalid response data:', data);
        throw new Error('لم يتم الحصول على نتائج التحليل');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "خطأ في التحليل",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال إجابة على السؤال",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingAnalysis(true);
    const newAnswers = [...userAnswers, currentAnswer];
    setUserAnswers(newAnswers);

    try {
      const { data } = await supabase.functions.invoke('analyze-idea', {
        body: {
          idea,
          analysisType: 'interactive_update',
          userId: user.id,
          currentQuestion: analysis?.interactive_questions?.[currentQuestionIndex],
          userAnswer: currentAnswer,
          allAnswers: newAnswers,
          previousAnalysis: analysis
        }
      });

      if (data && data.analysis && data.success) {
        setAnalysis(data.analysis);
        
        // انتقل للسؤال التالي أو أنه التفاعل
        if (currentQuestionIndex < (analysis?.interactive_questions?.length || 0) - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setCurrentAnswer("");
        } else {
          setIsInteractiveMode(false);
          toast({
            title: "تم التحديث",
            description: "تم تحديث التحليل بناءً على إجاباتك",
          });
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث التحليل",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAnalysis(false);
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

          {/* التحليل المالي للتحليل العميق */}
          {analysis.financial_analysis && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    التحليل المالي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">تكلفة البدء</h4>
                    <p className="text-sm text-muted-foreground">{analysis.financial_analysis.startup_cost}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">المصروفات الشهرية</h4>
                    <p className="text-sm text-muted-foreground">{analysis.financial_analysis.monthly_expenses}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">فترة التعادل</h4>
                    <p className="text-sm text-muted-foreground">{analysis.financial_analysis.break_even_time}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">العائد المتوقع</h4>
                    <p className="text-sm text-muted-foreground">{analysis.financial_analysis.roi_projection}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    تحليل المنافسة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">المنافسون الرئيسيون</h4>
                    <ul className="space-y-1">
                      {analysis.competitive_analysis?.main_competitors.map((competitor, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {competitor}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">التميز في السوق</h4>
                    <p className="text-sm text-muted-foreground">{analysis.competitive_analysis?.market_differentiation}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">حواجز الدخول</h4>
                    <p className="text-sm text-muted-foreground">{analysis.competitive_analysis?.barrier_to_entry}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* الأسئلة التفاعلية */}
          {analysis.interactive_questions && !isInteractiveMode && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  أسئلة لتطوير فكرتك
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.interactive_questions.map((question, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                      <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm flex-1 font-medium">{question}</p>
                      {userAnswers[index] && (
                        <div className="text-xs text-muted-foreground bg-green-50 px-2 py-1 rounded">
                          تم الرد
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {analysisType === 'interactive' && (
                  <Button
                    onClick={() => {
                      setIsInteractiveMode(true);
                      setCurrentQuestionIndex(0);
                    }}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    <MessageSquare className="w-4 h-4" />
                    ابدأ الإجابة على الأسئلة
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* واجهة الأسئلة التفاعلية */}
          {isInteractiveMode && analysis?.interactive_questions && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    السؤال {currentQuestionIndex + 1} من {analysis.interactive_questions.length}
                  </div>
                  <Badge variant="secondary">
                    {Math.round(((currentQuestionIndex + 1) / analysis.interactive_questions.length) * 100)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-background rounded-lg border">
                  <p className="font-medium text-lg mb-2">
                    {analysis.interactive_questions[currentQuestionIndex]}
                  </p>
                </div>
                
                <Textarea
                  placeholder="اكتب إجابتك هنا بالتفصيل..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="min-h-[100px] resize-none"
                  dir="rtl"
                />
                
                <div className="flex gap-2">
                  <Button
                    onClick={submitAnswer}
                    disabled={isUpdatingAnalysis || !currentAnswer.trim()}
                    className="flex-1"
                  >
                    {isUpdatingAnalysis ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري التحديث...
                      </>
                    ) : currentQuestionIndex < analysis.interactive_questions.length - 1 ? (
                      'التالي'
                    ) : (
                      'إنهاء التحليل'
                    )}
                  </Button>
                  
                  {currentQuestionIndex > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCurrentQuestionIndex(currentQuestionIndex - 1);
                        setCurrentAnswer(userAnswers[currentQuestionIndex - 1] || "");
                      }}
                      disabled={isUpdatingAnalysis}
                    >
                      السابق
                    </Button>
                  )}
                </div>
                
                {userAnswers.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    تم الإجابة على {userAnswers.length} من {analysis.interactive_questions.length} أسئلة
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* خطة العمل */}
          {analysis.action_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  خطة العمل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-600" />
                    خطوات فورية
                  </h4>
                  <ul className="space-y-2">
                    {analysis.action_plan.immediate_steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    أهداف قصيرة المدى
                  </h4>
                  <ul className="space-y-2">
                    {analysis.action_plan.short_term_goals.map((goal, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    الرؤية طويلة المدى
                  </h4>
                  <p className="text-sm text-muted-foreground p-3 bg-green-50 rounded-lg border border-green-200">
                    {analysis.action_plan.long_term_vision}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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