import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UsageLimitProps {
  type: 'analysis' | 'marketing_plan';
  currentCount: number;
  limit: number;
}

export const UsageLimit = ({ type, currentCount, limit }: UsageLimitProps) => {
  const navigate = useNavigate();

  const getTitle = () => {
    return type === 'analysis' ? 'تم تجاوز حد التحليلات' : 'تم تجاوز حد خطط التسويق';
  };

  const getMessage = () => {
    const serviceName = type === 'analysis' ? 'التحليلات' : 'خطط التسويق';
    return `عذراً، لقد تجاوزت الحد اليومي المسموح لـ${serviceName} (${limit}). يمكنك التواصل معنا لرفع الحد أو طلب المزيد.`;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-center">
            {getMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span>الاستخدام الحالي:</span>
              <span className="font-medium">{currentCount} من {limit}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/contact')} 
              className="w-full"
              size="lg"
            >
              <Phone className="w-4 h-4 mr-2" />
              تواصل معنا لرفع الحد
            </Button>
            
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="w-full"
              size="lg"
            >
              العودة للصفحة الرئيسية
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              سيتم إعادة تعيين الحدود تلقائياً غداً
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};