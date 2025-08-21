import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Brain, Calendar, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
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
        title: "خطأ في التحميل",
        description: "لم نتمكن من تحميل سجل التحليلات",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'basic': return 'تحليل أساسي';
      case 'detailed': return 'تحليل مفصل';
      case 'ai_chat': return 'محادثة ذكية';
      default: return 'تحليل';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return AlertCircle;
    return AlertCircle;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">تسجيل الدخول مطلوب</h1>
          <p className="text-muted-foreground mb-6">يرجى تسجيل الدخول لعرض تحليلاتك السابقة</p>
          <Link to="/auth">
            <Button>تسجيل الدخول</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              العودة للرئيسية
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">تحليلاتي السابقة</h1>
            <p className="text-muted-foreground">سجل جميع التحليلات والمحادثات السابقة</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : analyses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">لا توجد تحليلات سابقة</h2>
              <p className="text-muted-foreground mb-6">ابدأ محادثة جديدة أو قم بتحليل فكرة لتظهر هنا</p>
              <Link to="/">
                <Button>ابدأ الآن</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {analyses.map((analysis) => (
              <Card key={analysis.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {analysis.idea_text.length > 100 
                          ? `${analysis.idea_text.substring(0, 100)}...`
                          : analysis.idea_text
                        }
                      </CardTitle>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(analysis.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                        </div>
                        <Badge variant="secondary">
                          {getAnalysisTypeLabel(analysis.analysis_type)}
                        </Badge>
                      </div>
                    </div>
                    
                    {analysis.analysis_result?.overall_score && (
                      <div className="flex items-center gap-2">
                        {(() => {
                          const ScoreIcon = getScoreIcon(analysis.analysis_result.overall_score);
                          return <ScoreIcon className={`w-5 h-5 ${getScoreColor(analysis.analysis_result.overall_score)}`} />;
                        })()}
                        <span className={`text-lg font-bold ${getScoreColor(analysis.analysis_result.overall_score)}`}>
                          {analysis.analysis_result.overall_score}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {analysis.analysis_type === 'ai_chat' ? (
                    <div className="bg-gradient-glow p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {analysis.analysis_result?.response || 'رد المساعد الذكي'}
                      </p>
                    </div>
                  ) : analysis.analysis_result ? (
                    <div className="space-y-4">
                      {analysis.analysis_result.market_analysis && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            تحليل السوق
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {analysis.analysis_result.market_analysis.substring(0, 200)}...
                          </p>
                        </div>
                      )}
                      
                      {analysis.analysis_result.recommendations && (
                        <div>
                          <h4 className="font-semibold mb-2">التوصيات</h4>
                          <ul className="space-y-1">
                            {analysis.analysis_result.recommendations.slice(0, 3).map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">لا توجد تفاصيل متاحة</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;