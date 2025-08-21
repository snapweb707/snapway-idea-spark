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
import { useTranslation } from 'react-i18next';

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
  const [marketingPlan, setMarketingPlan] = useState<any>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const analyzeIdea = async () => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        description: t('loginRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!idea.trim()) {
      toast({
        title: t('analysisError'),
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
          userId: user.id,
          language: i18n.language
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
          title: t('analysisSuccess'),
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
        title: t('analysisError'),
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
          language: i18n.language,
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

  const generateMarketingPlan = async () => {
    if (!user) {
      toast({
        title: t('loginRequired'),
        description: t('loginRequired'),
        variant: "destructive",
      });
      return;
    }

    if (!analysis) {
      toast({
        title: t('analysisError'),
        description: i18n.language === 'ar' ? "يجب إجراء التحليل أولاً" : "Please run analysis first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPlan(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-marketing-plan', {
        body: {
          idea,
          analysis,
          language: i18n.language,
          userId: user.id
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.plan && data.success) {
        setMarketingPlan(data.plan);
        toast({
          title: i18n.language === 'ar' ? "تم إنشاء الخطة التسويقية" : "Marketing Plan Generated",
          description: i18n.language === 'ar' ? "تم إنشاء خطة تسويقية شاملة لفكرتك" : "Comprehensive marketing plan created for your idea",
        });
      } else {
        throw new Error(i18n.language === 'ar' ? 'فشل في إنشاء الخطة التسويقية' : 'Failed to generate marketing plan');
      }
    } catch (error) {
      console.error('Marketing plan error:', error);
      toast({
        title: i18n.language === 'ar' ? "خطأ في إنشاء الخطة" : "Plan Generation Error",
        description: error instanceof Error ? error.message : i18n.language === 'ar' ? "حدث خطأ غير متوقع" : "Unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPlan(false);
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
      case 'interactive': return t('interactiveAnalysis');
      case 'deep': return t('deepAnalysis');
      default: return t('basicAnalysis');
    }
  };

  const downloadMarketingPlanAsPDF = async () => {
    if (!marketingPlan) return;
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // إضافة الخط العربي
      pdf.addFont('https://fonts.gstatic.com/s/notoarabic/v18/Hgo13k-tfSpn0qi1SFdUfVtXRcuvYFyGmcM.ttf', 'NotoArabic', 'normal');
      pdf.setFont('NotoArabic');

      let yPosition = 20;
      const pageHeight = 280;
      const margin = 20;
      
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        if (yPosition > pageHeight) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(fontSize);
        pdf.setFont('NotoArabic', isBold ? 'bold' : 'normal');
        
        // تحويل النص للاتجاه الصحيح
        const processedText = text.split('\n').reverse().join('\n');
        const lines = pdf.splitTextToSize(processedText, 170);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight) {
            pdf.addPage();
            yPosition = 20;
          }
          // محاذاة النص للجهة اليمنى للعربية
          const lineWidth = pdf.getTextWidth(line);
          const xPosition = 210 - margin - lineWidth; // A4 width - margin - text width
          pdf.text(line, xPosition, yPosition);
          yPosition += fontSize * 0.5;
        });
        yPosition += 5;
      };

      // Title
      addText('خطة التسويق التفصيلية', 20, true);
      addText(`تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}`, 10);
      yPosition += 10;

      // Strategy
      if (marketingPlan.strategy) {
        addText('الاستراتيجية التسويقية:', 14, true);
        addText(marketingPlan.strategy, 10);
        yPosition += 5;
      }

      // Target Audience
      if (marketingPlan.target_audience) {
        addText('الجمهور المستهدف:', 14, true);
        addText(marketingPlan.target_audience, 10);
        yPosition += 5;
      }

      // Channels
      if (marketingPlan.channels && marketingPlan.channels.length > 0) {
        addText('القنوات التسويقية:', 14, true);
        marketingPlan.channels.forEach((channel: string, index: number) => {
          addText(`${index + 1}. ${channel}`, 10);
        });
        yPosition += 5;
      }

      // Budget
      if (marketingPlan.budget) {
        addText('الميزانية:', 14, true);
        addText(marketingPlan.budget, 10);
        yPosition += 5;
      }

      // Timeline
      if (marketingPlan.timeline) {
        addText('الجدول الزمني:', 14, true);
        addText(marketingPlan.timeline, 10);
        yPosition += 5;
      }

      // KPIs
      if (marketingPlan.kpis && marketingPlan.kpis.length > 0) {
        addText('مؤشرات الأداء الرئيسية:', 14, true);
        marketingPlan.kpis.forEach((kpi: string, index: number) => {
          addText(`${index + 1}. ${kpi}`, 10);
        });
        yPosition += 5;
      }

      // Action Items
      if (marketingPlan.action_items && marketingPlan.action_items.length > 0) {
        addText('الخطوات العملية:', 14, true);
        marketingPlan.action_items.forEach((item: string, index: number) => {
          addText(`${index + 1}. ${item}`, 10);
        });
      }

      const fileName = `marketing-plan-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "تم التحميل بنجاح",
        description: "تم تحميل خطة التسويق كملف PDF",
      });
    } catch (error) {
      console.error('Error generating marketing plan PDF:', error);
      toast({
        title: "خطأ في التحميل",
        description: "حدث خطأ أثناء إنشاء ملف PDF",
        variant: "destructive",
      });
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
      const isArabic = i18n.language === 'ar';
      reportElement.style.direction = isArabic ? 'rtl' : 'ltr';
      reportElement.style.textAlign = isArabic ? 'right' : 'left';
      
      reportElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Snapway</h1>
          <h2 style="margin: 10px 0; font-size: 20px;">${isArabic ? 'تقرير تحليل فكرة المشروع' : 'Business Idea Analysis Report'}</h2>
          <p style="margin: 5px 0; color: #666;">${isArabic ? 'تاريخ التحليل:' : 'Analysis Date:'} ${new Date().toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</p>
          <p style="margin: 5px 0; color: #666;">${isArabic ? 'نوع التحليل:' : 'Analysis Type:'} ${getAnalysisTypeName(analysisType)}</p>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #1e40af; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${isArabic ? 'النتائج الرئيسية' : 'Key Results'}</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
              <p><strong>${isArabic ? 'التقييم العام:' : 'Overall Score:'}</strong> ${analysis.overall_score}%</p>
              <p><strong>${isArabic ? 'إمكانية السوق:' : 'Market Potential:'}</strong> ${analysis.market_potential}%</p>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
              <p><strong>${isArabic ? 'قابلية التنفيذ:' : 'Feasibility:'}</strong> ${analysis.feasibility}%</p>
              <p><strong>${isArabic ? 'مستوى المخاطر:' : 'Risk Level:'}</strong> ${analysis.risk_level}%</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #16a34a; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${isArabic ? 'نقاط القوة' : 'Strengths'}</h3>
          <ul style="margin-top: 10px;">
            ${analysis.strengths.map(strength => `<li style="margin-bottom: 8px;">${strength}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #dc2626; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${isArabic ? 'نقاط الضعف' : 'Weaknesses'}</h3>
          <ul style="margin-top: 10px;">
            ${analysis.weaknesses.map(weakness => `<li style="margin-bottom: 8px;">${weakness}</li>`).join('')}
          </ul>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #7c3aed; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${isArabic ? 'التوصيات' : 'Recommendations'}</h3>
          <ol style="margin-top: 10px;">
            ${analysis.recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
          </ol>
        </div>

        ${analysis.next_steps ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #ea580c; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${isArabic ? 'الخطوات التالية' : 'Next Steps'}</h3>
          <div style="margin-top: 15px;">
            <h4 style="color: #2563eb;">${isArabic ? 'المرحلة الأولى:' : 'Phase 1:'}</h4>
            <ul>
              ${analysis.next_steps.phase_1?.map(step => `<li style="margin-bottom: 5px;">${step}</li>`).join('') || ''}
            </ul>
            <h4 style="color: #16a34a; margin-top: 15px;">${isArabic ? 'المرحلة الثانية:' : 'Phase 2:'}</h4>
            <ul>
              ${analysis.next_steps.phase_2?.map(step => `<li style="margin-bottom: 5px;">${step}</li>`).join('') || ''}
            </ul>
            <h4 style="color: #7c3aed; margin-top: 15px;">${isArabic ? 'المرحلة الثالثة:' : 'Phase 3:'}</h4>
            <ul>
              ${analysis.next_steps.phase_3?.map(step => `<li style="margin-bottom: 5px;">${step}</li>`).join('') || ''}
            </ul>
            ${analysis.next_steps.timeline ? `<p style="background: #f1f5f9; padding: 10px; border-radius: 5px; margin-top: 15px;"><strong>${isArabic ? 'الجدول الزمني:' : 'Timeline:'}</strong> ${analysis.next_steps.timeline}</p>` : ''}
          </div>
        </div>
        ` : ''}

        <div style="margin-bottom: 25px;">
          <h3 style="color: #0891b2; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${isArabic ? 'تفاصيل إضافية' : 'Additional Details'}</h3>
          <div style="margin-top: 15px;">
            <p style="margin-bottom: 10px;"><strong>${isArabic ? 'حجم السوق:' : 'Market Size:'}</strong> ${analysis.market_size}</p>
            <p style="margin-bottom: 10px;"><strong>${isArabic ? 'الجمهور المستهدف:' : 'Target Audience:'}</strong> ${analysis.target_audience}</p>
            <p style="margin-bottom: 10px;"><strong>${isArabic ? 'نموذج الإيرادات:' : 'Revenue Model:'}</strong> ${analysis.revenue_model}</p>
            <p style="margin-bottom: 10px;"><strong>${isArabic ? 'الميزة التنافسية:' : 'Competitive Advantage:'}</strong> ${analysis.competitive_advantage}</p>
          </div>
        </div>

        ${analysis.financial_analysis ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: #059669; border-bottom: 1px solid #ddd; padding-bottom: 5px;">${isArabic ? 'التحليل المالي' : 'Financial Analysis'}</h3>
          <div style="margin-top: 15px; background: #f0fdf4; padding: 15px; border-radius: 8px;">
            <p style="margin-bottom: 8px;"><strong>${isArabic ? 'تكلفة البدء:' : 'Startup Cost:'}</strong> ${analysis.financial_analysis.startup_cost}</p>
            <p style="margin-bottom: 8px;"><strong>${isArabic ? 'المصروفات الشهرية:' : 'Monthly Expenses:'}</strong> ${analysis.financial_analysis.monthly_expenses}</p>
            <p style="margin-bottom: 8px;"><strong>${isArabic ? 'فترة التعادل:' : 'Break-even Time:'}</strong> ${analysis.financial_analysis.break_even_time}</p>
            <p style="margin-bottom: 8px;"><strong>${isArabic ? 'العائد المتوقع:' : 'ROI Projection:'}</strong> ${analysis.financial_analysis.roi_projection}</p>
            ${analysis.financial_analysis.funding_requirements ? `<p style="margin-bottom: 8px;"><strong>${isArabic ? 'متطلبات التمويل:' : 'Funding Requirements:'}</strong> ${analysis.financial_analysis.funding_requirements}</p>` : ''}
          </div>
        </div>
        ` : ''}

        <div style="margin-top: 40px; text-align: center; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="margin: 0;">${isArabic ? 'تم إنشاء هذا التقرير بواسطة Snapway' : 'This report was generated by Snapway'}</p>
          <p style="margin: 5px 0; font-size: 14px;">${isArabic ? 'منصة تحليل المشاريع الذكية' : 'Smart Business Analysis Platform'}</p>
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
      const fileName = isArabic ? 
        `Snapway-تحليل-المشروع-${new Date().toISOString().split('T')[0]}.pdf` :
        `Snapway-Business-Analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: isArabic ? "تم التصدير بنجاح" : "Export Successful",
        description: isArabic ? "تم حفظ تقرير التحليل كملف PDF" : "Analysis report saved as PDF",
      });
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      toast({
        title: i18n.language === 'ar' ? "خطأ في التصدير" : "Export Error",
        description: i18n.language === 'ar' ? "فشل في إنشاء ملف PDF" : "Failed to create PDF file",
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
            {t('businessAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('analysisType')}
            </label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      {t('basicAnalysis')}
                    </div>
                </SelectItem>
                <SelectItem value="interactive">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {t('interactiveAnalysis')}
                    </div>
                </SelectItem>
                <SelectItem value="deep">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {t('deepAnalysis')}
                    </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t('ideaPlaceholder')}
            </label>
            <Textarea
              placeholder={t('ideaPlaceholder')}
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
                {t('signIn')}
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
                  {t('analyzing')}
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  {t('startAnalysis')}
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
                <p className="text-sm text-muted-foreground mt-1">{t('overallScore')}</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${getScoreColor(analysis.market_potential)}`}>
                  {analysis.market_potential}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t('marketPotential')}</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${getScoreColor(analysis.feasibility)}`}>
                  {analysis.feasibility}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t('feasibility')}</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className={`text-3xl font-bold ${getScoreColor(100 - analysis.risk_level)}`}>
                  {analysis.risk_level}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t('riskLevel')}</p>
              </CardContent>
            </Card>
          </div>

          {/* تفاصيل التحليل */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  {t('strengths')}
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
                  {t('weaknesses')}
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
                  {t('targetAudience')}
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
                  {t('marketSize')}
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
                  {t('revenueModel')}
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
                  {t('competitiveAdvantage')}
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
                  {t('nextSteps')}
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
                  {t('downloadPDF')}
                </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Marketing Plan Section */}
      {analysis && (
        <Card className="shadow-elegant border-border/50 bg-gradient-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="w-6 h-6 text-primary" />
              {i18n.language === 'ar' ? 'الخطة التسويقية' : 'Marketing Plan'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!marketingPlan ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {i18n.language === 'ar' ? 'إنشاء خطة تسويقية ذكية' : 'Generate Smart Marketing Plan'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {i18n.language === 'ar' 
                      ? 'احصل على خطة تسويقية شاملة ومخصصة لفكرة مشروعك باستخدام الذكاء الاصطناعي'
                      : 'Get a comprehensive, customized marketing plan for your business idea using AI'
                    }
                  </p>
                  <Button 
                    onClick={generateMarketingPlan}
                    disabled={isGeneratingPlan}
                    className="group"
                    size="lg"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {i18n.language === 'ar' ? 'جاري إنشاء الخطة...' : 'Generating Plan...'}
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        {i18n.language === 'ar' ? 'إنشاء خطة تسويقية' : 'Generate Marketing Plan'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Marketing Strategy */}
                {marketingPlan.strategy && (
                  <div className="bg-background/50 rounded-xl p-6 border border-border/50">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      {i18n.language === 'ar' ? 'الاستراتيجية التسويقية' : 'Marketing Strategy'}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">{marketingPlan.strategy}</p>
                  </div>
                )}

                {/* Target Audience */}
                {marketingPlan.target_audience && (
                  <div className="bg-background/50 rounded-xl p-6 border border-border/50">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-600" />
                      {i18n.language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}
                    </h4>
                    {typeof marketingPlan.target_audience === 'string' ? (
                      <p className="text-muted-foreground leading-relaxed">{marketingPlan.target_audience}</p>
                    ) : (
                      <div className="space-y-3">
                        {marketingPlan.target_audience.demographic_segments && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">{i18n.language === 'ar' ? 'الشرائح الديموغرافية' : 'Demographic Segments'}</h5>
                            <p className="text-muted-foreground text-sm">{marketingPlan.target_audience.demographic_segments}</p>
                          </div>
                        )}
                        {marketingPlan.target_audience.behavioral_segments && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">{i18n.language === 'ar' ? 'الشرائح السلوكية' : 'Behavioral Segments'}</h5>
                            <p className="text-muted-foreground text-sm">{marketingPlan.target_audience.behavioral_segments}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Marketing Channels */}
                {marketingPlan.channels && (
                  <div className="bg-background/50 rounded-xl p-6 border border-border/50">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      {i18n.language === 'ar' ? 'قنوات التسويق' : 'Marketing Channels'}
                    </h4>
                    {Array.isArray(marketingPlan.channels) ? (
                      <div className="grid md:grid-cols-2 gap-3">
                        {marketingPlan.channels.map((channel: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm">{channel}</span>
                          </div>
                        ))}
                      </div>
                    ) : typeof marketingPlan.channels === 'object' ? (
                      <div className="space-y-3">
                        {Object.entries(marketingPlan.channels).map(([key, value], index) => (
                          <div key={index}>
                            <h5 className="font-medium text-sm mb-2 capitalize">{key.replace(/_/g, ' ')}</h5>
                            <p className="text-muted-foreground text-sm">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{String(marketingPlan.channels)}</p>
                    )}
                  </div>
                )}

                {/* Budget Plan */}
                {marketingPlan.budget && (
                  <div className="bg-background/50 rounded-xl p-6 border border-border/50">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                      {i18n.language === 'ar' ? 'خطة الميزانية' : 'Budget Plan'}
                    </h4>
                    {typeof marketingPlan.budget === 'string' ? (
                      <p className="text-muted-foreground leading-relaxed">{marketingPlan.budget}</p>
                    ) : (
                      <div className="space-y-3">
                        {marketingPlan.budget.total_budget && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">{i18n.language === 'ar' ? 'إجمالي الميزانية' : 'Total Budget'}</h5>
                            <p className="text-muted-foreground text-sm">{marketingPlan.budget.total_budget}</p>
                          </div>
                        )}
                        {marketingPlan.budget.breakdown && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">{i18n.language === 'ar' ? 'تفصيل الميزانية' : 'Budget Breakdown'}</h5>
                            <p className="text-muted-foreground text-sm">{marketingPlan.budget.breakdown}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline */}
                {marketingPlan.timeline && (
                  <div className="bg-background/50 rounded-xl p-6 border border-border/50">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      {i18n.language === 'ar' ? 'الجدول الزمني' : 'Timeline'}
                    </h4>
                    {typeof marketingPlan.timeline === 'string' ? (
                      <p className="text-muted-foreground leading-relaxed">{marketingPlan.timeline}</p>
                    ) : (
                      <div className="space-y-3">
                        {marketingPlan.timeline.phase_1 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">{i18n.language === 'ar' ? 'المرحلة الأولى' : 'Phase 1'}</h5>
                            <p className="text-muted-foreground text-sm">{marketingPlan.timeline.phase_1}</p>
                          </div>
                        )}
                        {marketingPlan.timeline.phase_2 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">{i18n.language === 'ar' ? 'المرحلة الثانية' : 'Phase 2'}</h5>
                            <p className="text-muted-foreground text-sm">{marketingPlan.timeline.phase_2}</p>
                          </div>
                        )}
                        {marketingPlan.timeline.phase_3 && (
                          <div>
                            <h5 className="font-medium text-sm mb-2">{i18n.language === 'ar' ? 'المرحلة الثالثة' : 'Phase 3'}</h5>
                            <p className="text-muted-foreground text-sm">{marketingPlan.timeline.phase_3}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* KPIs */}
                {marketingPlan.kpis && (
                  <div className="bg-background/50 rounded-xl p-6 border border-border/50">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                      {i18n.language === 'ar' ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}
                    </h4>
                    {Array.isArray(marketingPlan.kpis) ? (
                      <div className="space-y-2">
                        {marketingPlan.kpis.map((kpi: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{kpi}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">{String(marketingPlan.kpis)}</p>
                    )}
                  </div>
                )}

                {/* Action Items */}
                {marketingPlan.action_items && (
                  <div className="bg-background/50 rounded-xl p-6 border border-border/50">
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      {i18n.language === 'ar' ? 'الخطوات العملية' : 'Action Items'}
                    </h4>
                    {Array.isArray(marketingPlan.action_items) ? (
                      <div className="space-y-3">
                        {marketingPlan.action_items.map((item: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">{String(marketingPlan.action_items)}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setMarketingPlan(null)}
                    className="flex-1"
                  >
                    {i18n.language === 'ar' ? 'إنشاء خطة جديدة' : 'Generate New Plan'}
                  </Button>
                  <Button 
                    onClick={generateMarketingPlan}
                    disabled={isGeneratingPlan}
                    className="flex-1"
                  >
                    {i18n.language === 'ar' ? 'تحديث الخطة' : 'Update Plan'}
                  </Button>
                  <Button 
                    onClick={() => downloadMarketingPlanAsPDF()}
                    variant="secondary"
                    className="flex-1"
                  >
                    {i18n.language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessAnalysis;