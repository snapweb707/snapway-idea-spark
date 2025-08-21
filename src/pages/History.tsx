import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import { 
  History as HistoryIcon, 
  Calendar, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Globe,
  Loader2,
  Download,
  Eye,
  Maximize2
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AnalysisRecord {
  id: string;
  idea_text: string;
  analysis_result: any;
  analysis_type: string;
  language: string;
  created_at: string;
}

const History = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAnalysisHistory();
    }
  }, [user]);

  const fetchAnalysisHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      toast({
        title: t('analysisError'),
        description: "حدث خطأ في تحميل التحليلات السابقة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'basic': return 'تحليل أساسي';
      case 'detailed': return 'تحليل مفصل';
      case 'comprehensive': return 'تحليل شامل';
      default: return 'تحليل';
    }
  };

  const getLanguageLabel = (lang: string) => {
    return lang === 'ar' ? 'العربية' : 'English';
  };

  const renderAnalysisResult = (result: any) => {
    if (!result) return null;

    if (typeof result === 'string') {
      return (
        <div className="prose prose-sm max-w-none text-right">
          <p className="whitespace-pre-wrap">{result}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {result.overall_score && (
          <div className="bg-gradient-glow p-4 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              التقييم العام
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{result.overall_score}%</div>
                <div className="text-sm text-muted-foreground">النتيجة الإجمالية</div>
              </div>
              {result.market_potential && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.market_potential}%</div>
                  <div className="text-sm text-muted-foreground">إمكانية السوق</div>
                </div>
              )}
              {result.feasibility && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.feasibility}%</div>
                  <div className="text-sm text-muted-foreground">قابلية التنفيذ</div>
                </div>
              )}
            </div>
            {result.risk_level && (
              <div className="mt-4 text-center">
                <div className="text-lg font-semibold text-orange-600">مستوى المخاطر: {result.risk_level}%</div>
              </div>
            )}
          </div>
        )}

        {result.market_size && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-600">
              <Globe className="w-4 h-4" />
              حجم السوق
            </h4>
            <p className="text-muted-foreground bg-muted p-3 rounded-lg">{result.market_size}</p>
          </div>
        )}

        {result.target_audience && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-purple-600">
              <CheckCircle className="w-4 h-4" />
              الجمهور المستهدف
            </h4>
            <p className="text-muted-foreground bg-muted p-3 rounded-lg">{result.target_audience}</p>
          </div>
        )}

        {result.revenue_model && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              نموذج الإيرادات
            </h4>
            <p className="text-muted-foreground bg-muted p-3 rounded-lg">{result.revenue_model}</p>
          </div>
        )}

        {result.competitive_advantage && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-indigo-600">
              <CheckCircle className="w-4 h-4" />
              الميزة التنافسية
            </h4>
            <p className="text-muted-foreground bg-muted p-3 rounded-lg">{result.competitive_advantage}</p>
          </div>
        )}
        
        {result.strengths && result.strengths.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              نقاط القوة
            </h4>
            <ul className="space-y-2 bg-green-50 p-3 rounded-lg">
              {result.strengths.map((strength: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {result.weaknesses && result.weaknesses.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              نقاط الضعف
            </h4>
            <ul className="space-y-2 bg-red-50 p-3 rounded-lg">
              {result.weaknesses.map((weakness: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {result.recommendations && result.recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-600">
              <FileText className="w-4 h-4" />
              التوصيات
            </h4>
            <ul className="space-y-2 bg-blue-50 p-3 rounded-lg">
              {result.recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.next_steps && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-purple-600">
              <TrendingUp className="w-4 h-4" />
              الخطوات التالية
            </h4>
            <div className="space-y-4">
              {result.next_steps.phase_1 && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h5 className="font-medium text-purple-800 mb-2">المرحلة الأولى:</h5>
                  <ul className="space-y-1">
                    {result.next_steps.phase_1.map((step: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.next_steps.phase_2 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">المرحلة الثانية:</h5>
                  <ul className="space-y-1">
                    {result.next_steps.phase_2.map((step: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.next_steps.phase_3 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2">المرحلة الثالثة:</h5>
                  <ul className="space-y-1">
                    {result.next_steps.phase_3.map((step: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.next_steps.timeline && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h5 className="font-medium text-gray-800 mb-2">الجدول الزمني:</h5>
                  <p className="text-sm text-muted-foreground">{result.next_steps.timeline}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legacy support for old format */}
        {result.summary && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              الملخص
            </h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
          </div>
        )}

        {result.opportunities && result.opportunities.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-600">
              <TrendingUp className="w-4 h-4" />
              الفرص المتاحة
            </h4>
            <ul className="space-y-1">
              {result.opportunities.map((opportunity: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">• {opportunity}</li>
              ))}
            </ul>
          </div>
        )}
        
        {result.score && !result.overall_score && (
          <div>
            <h4 className="font-semibold mb-2">التقييم العام</h4>
            <div className="flex items-center gap-2">
              <div className="w-full bg-secondary rounded-full h-3">
                <div 
                  className="bg-gradient-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <span className="text-sm font-medium">{result.score}%</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const downloadAnalysisAsPDF = async (analysis: AnalysisRecord) => {
    setDownloadingPdf(true);
    try {
      // Generate comprehensive PDF content
      const isArabic = analysis.language === 'ar';
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let yPosition = 20;
      const pageHeight = 280;
      const rightMargin = 200;
      const leftMargin = 10;
      
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        if (yPosition > pageHeight) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(fontSize);
        if (isBold) pdf.setFont(undefined, 'bold');
        else pdf.setFont(undefined, 'normal');
        
        const lines = pdf.splitTextToSize(text, 180);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, isArabic ? rightMargin : leftMargin, yPosition);
          yPosition += fontSize * 0.5;
        });
        yPosition += 5;
      };

      // Title and header
      addText('تحليل فكرة المشروع الشامل', 20, true);
      addText(`التاريخ: ${format(new Date(analysis.created_at), 'dd/MM/yyyy HH:mm')}`, 12);
      addText(`نوع التحليل: ${getAnalysisTypeLabel(analysis.analysis_type)}`, 12);
      addText(`اللغة: ${getLanguageLabel(analysis.language)}`, 12);
      yPosition += 10;

      // Idea text
      addText('نص الفكرة:', 14, true);
      addText(analysis.idea_text, 10);
      yPosition += 10;

      // Analysis results
      if (analysis.analysis_result) {
        const result = analysis.analysis_result;
        addText('نتائج التحليل:', 16, true);
        
        // Scores section
        if (result.overall_score || result.market_potential || result.feasibility) {
          addText('التقييمات:', 14, true);
          if (result.overall_score) addText(`النتيجة الإجمالية: ${result.overall_score}%`, 12);
          if (result.market_potential) addText(`إمكانية السوق: ${result.market_potential}%`, 12);
          if (result.feasibility) addText(`قابلية التنفيذ: ${result.feasibility}%`, 12);
          if (result.risk_level) addText(`مستوى المخاطر: ${result.risk_level}%`, 12);
          yPosition += 5;
        }

        // Market size
        if (result.market_size) {
          addText('حجم السوق:', 14, true);
          addText(result.market_size, 10);
        }

        // Target audience
        if (result.target_audience) {
          addText('الجمهور المستهدف:', 14, true);
          addText(result.target_audience, 10);
        }

        // Revenue model
        if (result.revenue_model) {
          addText('نموذج الإيرادات:', 14, true);
          addText(result.revenue_model, 10);
        }

        // Competitive advantage
        if (result.competitive_advantage) {
          addText('الميزة التنافسية:', 14, true);
          addText(result.competitive_advantage, 10);
        }

        // Strengths
        if (result.strengths && result.strengths.length > 0) {
          addText('نقاط القوة:', 14, true);
          result.strengths.forEach((strength: string, index: number) => {
            addText(`${index + 1}. ${strength}`, 10);
          });
        }

        // Weaknesses
        if (result.weaknesses && result.weaknesses.length > 0) {
          addText('نقاط الضعف:', 14, true);
          result.weaknesses.forEach((weakness: string, index: number) => {
            addText(`${index + 1}. ${weakness}`, 10);
          });
        }

        // Recommendations
        if (result.recommendations && result.recommendations.length > 0) {
          addText('التوصيات:', 14, true);
          result.recommendations.forEach((recommendation: string, index: number) => {
            addText(`${index + 1}. ${recommendation}`, 10);
          });
        }

        // Next steps
        if (result.next_steps) {
          addText('الخطوات التالية:', 14, true);
          
          if (result.next_steps.phase_1) {
            addText('المرحلة الأولى:', 12, true);
            result.next_steps.phase_1.forEach((step: string, index: number) => {
              addText(`${index + 1}. ${step}`, 10);
            });
          }
          
          if (result.next_steps.phase_2) {
            addText('المرحلة الثانية:', 12, true);
            result.next_steps.phase_2.forEach((step: string, index: number) => {
              addText(`${index + 1}. ${step}`, 10);
            });
          }
          
          if (result.next_steps.phase_3) {
            addText('المرحلة الثالثة:', 12, true);
            result.next_steps.phase_3.forEach((step: string, index: number) => {
              addText(`${index + 1}. ${step}`, 10);
            });
          }
          
          if (result.next_steps.timeline) {
            addText('الجدول الزمني:', 12, true);
            addText(result.next_steps.timeline, 10);
          }
        }

        // Legacy support for old format
        if (typeof result === 'string') {
          addText('نتائج التحليل:', 14, true);
          addText(result, 10);
        } else if (result.summary) {
          addText('الملخص:', 14, true);
          addText(result.summary, 10);
        }

        if (result.opportunities && result.opportunities.length > 0) {
          addText('الفرص المتاحة:', 14, true);
          result.opportunities.forEach((opportunity: string, index: number) => {
            addText(`${index + 1}. ${opportunity}`, 10);
          });
        }
      }
      
      // Save PDF
      const fileName = `analysis_${format(new Date(analysis.created_at), 'yyyy-MM-dd_HH-mm')}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: isArabic ? "تم التحميل بنجاح" : "Downloaded Successfully",
        description: isArabic ? "تم تحميل التحليل كملف PDF" : "Analysis downloaded as PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: t('analysisError'),
        description: "حدث خطأ في تحميل الملف",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('loginRequired')}</h1>
          <p className="text-muted-foreground">لعرض تاريخ التحليلات الخاص بك</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <HistoryIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">تاريخ التحليلات</h1>
              <p className="text-muted-foreground">جميع تحليلاتك السابقة</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* History List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">التحليلات السابقة ({analyses.length})</h2>
              
              {analyses.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد تحليلات بعد</h3>
                    <p className="text-muted-foreground">ابدأ بتحليل فكرتك الأولى!</p>
                  </CardContent>
                </Card>
              ) : (
                analyses.map((analysis) => (
                  <Card 
                    key={analysis.id} 
                    className={`cursor-pointer transition-all hover:shadow-glow ${
                      selectedAnalysis?.id === analysis.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {analysis.idea_text}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(analysis.created_at), 'dd MMM yyyy', { locale: ar })}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline">
                            {getAnalysisTypeLabel(analysis.analysis_type)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="w-3 h-3" />
                            {getLanguageLabel(analysis.language)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAnalysis(analysis);
                              setIsFullViewOpen(true);
                            }}
                            className="p-1 h-auto"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>

            {/* Analysis Details */}
            <div className="lg:sticky lg:top-24 lg:h-fit">
              {selectedAnalysis ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>تفاصيل التحليل</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsFullViewOpen(true)}
                          className="gap-2"
                        >
                          <Maximize2 className="w-4 h-4" />
                          عرض كامل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAnalysisAsPDF(selectedAnalysis)}
                          disabled={downloadingPdf}
                          className="gap-2"
                        >
                          {downloadingPdf ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          تحميل PDF
                        </Button>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getAnalysisTypeLabel(selectedAnalysis.analysis_type)}
                          </Badge>
                          <Badge variant="secondary">
                            {getLanguageLabel(selectedAnalysis.language)}
                          </Badge>
                        </div>
                      </div>
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedAnalysis.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">نص الفكرة</h4>
                      <p className="text-muted-foreground bg-muted p-3 rounded-lg whitespace-pre-wrap">
                        {selectedAnalysis.idea_text}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-4">نتائج التحليل</h4>
                      {renderAnalysisResult(selectedAnalysis.analysis_result)}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">اختر تحليلاً لعرض التفاصيل</h3>
                    <p className="text-muted-foreground">انقر على أي تحليل من القائمة</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Full View Dialog */}
        <Dialog open={isFullViewOpen} onOpenChange={setIsFullViewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="full-analysis-description">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>عرض التحليل الكامل</span>
                {selectedAnalysis && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAnalysisAsPDF(selectedAnalysis)}
                      disabled={downloadingPdf}
                      className="gap-2"
                    >
                      {downloadingPdf ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      تحميل PDF
                    </Button>
                    <Badge variant="outline">
                      {getAnalysisTypeLabel(selectedAnalysis.analysis_type)}
                    </Badge>
                    <Badge variant="secondary">
                      {getLanguageLabel(selectedAnalysis.language)}
                    </Badge>
                  </div>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedAnalysis && (
              <div className="space-y-6 mt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedAnalysis.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">نص الفكرة</h4>
                  <p className="text-muted-foreground bg-muted p-4 rounded-lg whitespace-pre-wrap">
                    {selectedAnalysis.idea_text}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-4">نتائج التحليل</h4>
                  {renderAnalysisResult(selectedAnalysis.analysis_result)}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default History;