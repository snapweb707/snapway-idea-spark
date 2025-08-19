import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Settings, Key, Shield, CheckCircle, XCircle } from "lucide-react";
import Header from "@/components/Header";

const Admin = () => {
  const [apiKey, setApiKey] = useState("");
  const [isKeySet, setIsKeySet] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySet(true);
    }
  }, []);

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال API Key",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey.startsWith("sk-")) {
      toast({
        title: "خطأ في التنسيق",
        description: "API Key يجب أن يبدأ بـ sk-",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("openai_api_key", apiKey);
    setIsKeySet(true);
    toast({
      title: "تم الحفظ",
      description: "تم حفظ API Key بنجاح",
    });
  };

  const removeApiKey = () => {
    localStorage.removeItem("openai_api_key");
    setApiKey("");
    setIsKeySet(false);
    toast({
      title: "تم الحذف",
      description: "تم حذف API Key",
    });
  };

  const testConnection = async () => {
    if (!apiKey) {
      toast({
        title: "خطأ",
        description: "لا يوجد API Key محفوظ",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);

    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        toast({
          title: "نجح الاتصال",
          description: "API Key يعمل بشكل صحيح",
        });
      } else {
        throw new Error("فشل في الاتصال");
      }
    } catch (error) {
      toast({
        title: "فشل الاتصال",
        description: "API Key غير صحيح أو منتهي الصلاحية",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Settings className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">إعدادات النظام</h1>
            <p className="text-muted-foreground">
              قم بإعداد مفاتيح API للذكاء الاصطناعي
            </p>
          </div>

          <Card className="shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                OpenAI API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  API Key
                </label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                    dir="ltr"
                  />
                  <Button 
                    onClick={saveApiKey}
                    variant="default"
                  >
                    حفظ
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-glow">
                {isKeySet ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">API Key محفوظ</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-700">لم يتم حفظ API Key</span>
                  </>
                )}
              </div>

              {isKeySet && (
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={testConnection}
                    disabled={isTestingConnection}
                    variant="premium"
                  >
                    {isTestingConnection ? "جاري الاختبار..." : "اختبار الاتصال"}
                  </Button>
                  <Button
                    onClick={removeApiKey}
                    variant="destructive"
                  >
                    حذف المفتاح
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                معلومات الأمان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  يتم حفظ API Key محلياً في متصفحك
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  لا يتم إرسال المفتاح إلى خوادمنا
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  يمكنك الحصول على API Key من platform.openai.com
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  تأكد من تفعيل الفوترة في حساب OpenAI
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elegant border-border/50 bg-gradient-glow">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="font-semibold">كيفية الحصول على API Key</h3>
                <p className="text-sm text-muted-foreground">
                  1. سجل الدخول إلى platform.openai.com
                  <br />
                  2. اذهب إلى API Keys
                  <br />
                  3. انقر على "Create new secret key"
                  <br />
                  4. انسخ المفتاح والصقه هنا
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;