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
import { Loader2, TrendingUp, Target, DollarSign, Users, AlertTriangle, CheckCircle, BarChart3, LogIn, MessageSquare, Calendar, Lightbulb, Download, ArrowRight } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  next_steps?: {
    phase_1: string[];
    phase_2: string[];
    phase_3: string[];
    timeline: string;
  };
  financial_analysis?: {
    startup_cost: string;
    monthly_expenses: string;
    break_even_time: string;
    roi_projection: string;
    funding_requirements: string;
  };
  competitive_analysis?: {
    main_competitors: string[];
    market_differentiation: string;
    barrier_to_entry: string;
    swot_analysis: string;
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

      console.log('Edge function response:', { data, error });
      
      // التحقق من وجود خطأ في الاستدعاء نفسه
      if (error) {
        throw new Error(`خطأ في استدعاء الخدمة: ${error.message}`);
      }

      // التحقق من وجود البيانات
      if (!data) {
        throw new Error('لم يتم الحصول على استجابة من الخدمة');
      }

      // التحقق من وجود خطأ في البيانات المُرجعة
      if (data.error) {
        throw new Error(data.error);
      }

      if (data && data.analysis && data.success) {
        console.log('Analysis received:', data.analysis);
        setAnalysis(data.analysis);
        
        // إذا كان التحليل تفاعلي، ابدأ الوضع التفاعلي فوراً
        if (analysisType === 'interactive' && data.analysis.interactive_questions?.length > 0) {
          setTimeout(() => {
            setIsInteractiveMode(true);
            setCurrentQuestionIndex(0);
            setUserAnswers([]);
          }, 1000); // انتظار ثانية واحدة لإظهار النتائج أولاً
        }
        
        toast({
          title: "تم التحليل بنجاح",
          description: analysisType === 'interactive' ? 
            "تم إجراء التحليل بنجاح. سيبدأ الوضع التفاعلي قريباً" : 
            "تم إجراء التحليل بنجاح وإنشاء التوصيات",
        });
      } else {
        console.error('Invalid response data:', data);
        throw new Error('لم يتم الحصول على نتائج التحليل صحيحة');
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
      const { data, error } = await supabase.functions.invoke('analyze-idea', {
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

      // التحقق من الخطأ بأمان
      if (error) {
        throw new Error(`خطأ في الاستدعاء: ${error.message}`);
      }

      if (!data) {
        throw new Error('لم يتم الحصول على استجابة');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data && data.analysis && data.success) {
        setAnalysis(data.analysis);
        
        // انتقل للسؤال التالي أو أنه التفاعل
        if (currentQuestionIndex < (analysis?.interactive_questions?.length || 0) - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setCurrentAnswer("");
          toast({
            title: "تم التحديث",
            description: `تم تحديث التحليل. السؤال ${currentQuestionIndex + 2} من ${analysis?.interactive_questions?.length}`,
          });
        } else {
          setIsInteractiveMode(false);
          toast({
            title: "انتهى التحليل التفاعلي",
            description: "تم تحديث التحليل النهائي بناءً على جميع إجاباتك",
          });
        }
      } else {
        throw new Error('استجابة غير صحيحة من الخدمة');
      }
    } catch (error) {
      console.error('Update error:', error);
      // Skip to next question instead of stopping
      if (currentQuestionIndex < (analysis?.interactive_questions?.length || 0) - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer("");
        toast({
          title: "تم التخطي",
          description: "تم الانتقال للسؤال التالي",
        });
      } else {
        setIsInteractiveMode(false);
        toast({
          title: "تم الانتهاء",
          description: "تم الانتهاء من الأسئلة التفاعلية",
        });
      }
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

  const exportToPDF = async () => {
    if (!analysis) return;

    try {
      // إنشاء عنصر HTML للتقرير
      const reportElement = document.createElement('div');
      reportElement.style.width = '794px'; // A4 width in pixels
      reportElement.style.padding = '40px';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      reportElement.style.backgroundColor = 'white';
      reportElement.style.color = 'black';
      reportElement.style.direction = 'rtl';
      reportElement.style.textAlign = 'right';
      
      // محتوى التقرير بـ HTML
      reportElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Snapway</h1>
          <h2 style="margin: 10px 0; font-size: 20px;">تقرير تحليل فكرة المشروع</h2>
          <p style="margin: 5px 0; color: #666;">تاريخ التحليل: ${new Date().toLocaleDateString('ar-EG')}</p>
          <p style="margin: 5px 0; color: #666;">نوع التحليل: ${getAnalysisTypeName(analysisType)}</p>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">النتائج الرئيسية</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
              <p><strong>التقييم العام:</strong> ${analysis.overall_score}%</p>
              <p><strong>إمكانية السوق:</strong> ${analysis.market_potential}%</p>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
              <p><strong>قابلية التنفيذ:</strong> ${analysis.feasibility}%</p>
              <p><strong>مستوى المخاطر:</strong> ${analysis.risk_level}%</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #16a34a; border-bottom: 1px solid #ddd; padding-bottom: 5px;">نقاط القوة</h3>
          <ul style="margin-top: 10px;">
            ${analysis.strengths.map(strength => `<li style="margin-bottom: 8px;">${strength}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #dc2626; border-bottom: 1px solid #ddd; padding-bottom: 5px;">نقاط الضعف</h3>
          <ul style="margin-top: 10px;">
            ${analysis.weaknesses.map(weakness => `<li style="margin-bottom: 8px;">${weakness}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #7c3aed; border-bottom: 1px solid #ddd; padding-bottom: 5px;">التوصيات</h3>
          <ol style="margin-top: 10px;">
            ${analysis.recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
          </ol>
        </div>

        ${analysis.next_steps ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #ea580c; border-bottom: 1px solid #ddd; padding-bottom: 5px;">الخطوات التالية</h3>
          <div style="margin-top: 15px;">
            <h4 style="color: #2563eb;">المرحلة الأولى:</h4>
            <ul>
              ${analysis.next_steps.phase_1?.map(step => `<li style="margin-bottom: 5px;">${step}</li>`).join('') || ''}
            </ul>
            <h4 style="color: #16a34a; margin-top: 15px;">المرحلة الثانية:</h4>
            <ul>
              ${analysis.next_steps.phase_2?.map(step => `<li style="margin-bottom: 5px;">${step}</li>`).join('') || ''}
            </ul>
            <h4 style="color: #7c3aed; margin-top: 15px;">المرحلة الثالثة:</h4>
            <ul>
              ${analysis.next_steps.phase_3?.map(step => `<li style="margin-bottom: 5px;">${step}</li>`).join('') || ''}
            </ul>
            ${analysis.next_steps.timeline ? `<p style="background: #f1f5f9; padding: 10px; border-radius: 5px; margin-top: 15px;"><strong>الجدول الزمني:</strong> ${analysis.next_steps.timeline}</p>` : ''}
          </div>
        </div>
        ` : ''}

        <div style="margin-bottom: 25px;">
          <h3 style="color: #0891b2; border-bottom: 1px solid #ddd; padding-bottom: 5px;">تفاصيل إضافية</h3>
          <div style="margin-top: 15px;">
            <p style="margin-bottom: 10px;"><strong>حجم السوق:</strong> ${analysis.market_size}</p>
            <p style="margin-bottom: 10px;"><strong>الجمهور المستهدف:</strong> ${analysis.target_audience}</p>
            <p style="margin-bottom: 10px;"><strong>نموذج الإيرادات:</strong> ${analysis.revenue_model}</p>
            <p style="margin-bottom: 10px;"><strong>الميزة التنافسية:</strong> ${analysis.competitive_advantage}</p>
          </div>
        </div>

        ${analysis.financial_analysis ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #059669; border-bottom: 1px solid #ddd; padding-bottom: 5px;">التحليل المالي</h3>
          <div style="margin-top: 15px; background: #f0fdf4; padding: 15px; border-radius: 8px;">
            <p style="margin-bottom: 8px;"><strong>تكلفة البدء:</strong> ${analysis.financial_analysis.startup_cost}</p>
            <p style="margin-bottom: 8px;"><strong>المصروفات الشهرية:</strong> ${analysis.financial_analysis.monthly_expenses}</p>
            <p style="margin-bottom: 8px;"><strong>فترة التعادل:</strong> ${analysis.financial_analysis.break_even_time}</p>
            <p style="margin-bottom: 8px;"><strong>العائد المتوقع:</strong> ${analysis.financial_analysis.roi_projection}</p>
            ${analysis.financial_analysis.funding_requirements ? `<p style="margin-bottom: 8px;"><strong>متطلبات التمويل:</strong> ${analysis.financial_analysis.funding_requirements}</p>` : ''}
          </div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="margin: 0;">تم إنشاء هذا التقرير بواسطة Snapway</p>
          <p style="margin: 5px 0; font-size: 14px;">منصة تحليل المشاريع الذكية</p>
        </div>
      `;

      // إضافة العنصر إلى الصفحة مؤقتاً
      document.body.appendChild(reportElement);

      // إنشاء الصورة باستخدام html2canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        width: 794,
        height: reportElement.scrollHeight
      });

      // إزالة العنصر من الصفحة
      document.body.removeChild(reportElement);

      // إنشاء PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // إضافة الصفحة الأولى
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // إضافة صفحات إضافية إذا لزم الأمر
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // حفظ الملف
      const fileName = `Snapway-تحليل-المشروع-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم حفظ تقرير التحليل كملف PDF",
      });
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      toast({
        title: "خطأ في التصدير",
        description: "فشل في إنشاء ملف PDF",
        variant: "destructive",
      });
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

          {/* الخطوات التالية */}
          {analysis.next_steps && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-primary" />
                  الخطوات التالية لمشروعك
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <h4 className="font-semibold text-sm">المرحلة الأولى</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysis.next_steps.phase_1?.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <h4 className="font-semibold text-sm">المرحلة الثانية</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysis.next_steps.phase_2?.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <h4 className="font-semibold text-sm">المرحلة الثالثة</h4>
                    </div>
                    <ul className="space-y-2">
                      {analysis.next_steps.phase_3?.map((step, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {analysis.next_steps.timeline && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      الجدول الزمني المقترح
                    </h4>
                    <p className="text-sm text-muted-foreground">{analysis.next_steps.timeline}</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                {analysisType === 'interactive' && !isInteractiveMode && (
                  <Button
                    onClick={() => {
                      setIsInteractiveMode(true);
                      setCurrentQuestionIndex(0);
                      setCurrentAnswer("");
                      setUserAnswers([]);
                    }}
                    className="w-full mt-4"
                    variant="default"
                  >
                    <MessageSquare className="w-4 h-4" />
                    ابدأ الإجابة على الأسئلة التفاعلية
                  </Button>
                )}
                
                {analysisType !== 'interactive' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      💡 لتجربة تفاعلية أكثر، اختر "التحليل التفاعلي" واحصل على أسئلة مخصصة لتطوير فكرتك
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* واجهة الأسئلة التفاعلية */}
          {isInteractiveMode && analysis?.interactive_questions && (
            <Card className="border-primary bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span>السؤال {currentQuestionIndex + 1} من {analysis.interactive_questions.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/20 text-primary">
                      {Math.round(((currentQuestionIndex + 1) / analysis.interactive_questions.length) * 100)}%
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsInteractiveMode(false);
                        setCurrentAnswer("");
                      }}
                    >
                      إغلاق
                    </Button>
                  </div>
                </CardTitle>
                
                {/* شريط التقدم */}
                <div className="w-full bg-background rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((currentQuestionIndex + 1) / analysis.interactive_questions.length) * 100}%` 
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-background rounded-lg border-l-4 border-l-primary">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                      {currentQuestionIndex + 1}
                    </div>
                    <p className="font-medium text-lg leading-relaxed">
                      {analysis.interactive_questions[currentQuestionIndex]}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    إجابتك (كن مفصلاً للحصول على تحليل أفضل)
                  </label>
                  <Textarea
                    placeholder="اكتب إجابتك هنا بالتفصيل... كلما كانت إجابتك أكثر تفصيلاً، كان التحليل أدق وأفضل"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="min-h-[120px] resize-none"
                    dir="rtl"
                  />
                  <div className="text-xs text-muted-foreground">
                    {currentAnswer.length} حرف - يُنصح بكتابة 50 حرف على الأقل
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={submitAnswer}
                    disabled={isUpdatingAnalysis || !currentAnswer.trim()}
                    className="flex-1"
                    size="lg"
                  >
                    {isUpdatingAnalysis ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري تحديث التحليل...
                      </>
                    ) : currentQuestionIndex < analysis.interactive_questions.length - 1 ? (
                      <>
                        التالي ←
                        <span className="text-xs mr-2">
                          (سؤال {currentQuestionIndex + 2})
                        </span>
                      </>
                    ) : (
                      <>
                        إنهاء التحليل التفاعلي ✨
                      </>
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
                      ← السابق
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <span>تم الإجابة على {userAnswers.length} من {analysis.interactive_questions.length} أسئلة</span>
                  <span className="text-primary font-medium">
                    متبقي {analysis.interactive_questions.length - currentQuestionIndex - 1} أسئلة
                  </span>
                </div>
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

          {/* زر تحميل PDF */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={exportToPDF}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Download className="w-4 h-4" />
                تحميل التحليل كملف PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BusinessAnalysis;