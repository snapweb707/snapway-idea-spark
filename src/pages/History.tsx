import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  History as HistoryIcon, 
  Calendar, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Globe,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisRecord | null>(null);

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
        title: "خطأ",
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
      <div className="space-y-4">
        {result.summary && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              الملخص
            </h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
          </div>
        )}
        
        {result.strengths && result.strengths.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              نقاط القوة
            </h4>
            <ul className="space-y-1">
              {result.strengths.map((strength: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">• {strength}</li>
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
            <ul className="space-y-1">
              {result.weaknesses.map((weakness: string, index: number) => (
                <li key={index} className="text-sm text-muted-foreground">• {weakness}</li>
              ))}
            </ul>
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
        
        {result.score && (
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">يجب تسجيل الدخول أولاً</h1>
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
                        <Badge variant="outline">
                          {getAnalysisTypeLabel(selectedAnalysis.analysis_type)}
                        </Badge>
                        <Badge variant="secondary">
                          {getLanguageLabel(selectedAnalysis.language)}
                        </Badge>
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
      </div>
    </div>
  );
};

export default History;