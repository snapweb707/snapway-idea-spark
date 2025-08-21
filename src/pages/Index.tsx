import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Send, MessageSquare, Zap, LogIn, UserPlus, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([
    {
      role: "assistant",
      content: "مرحباً! أنا مساعدك الذكي في Snapway. يمكنني مساعدتك في تحليل الأفكار التجارية، الإجابة على الأسئلة، وتقديم النصائح المالية والتقنية. كيف يمكنني مساعدتك اليوم؟"
    }
  ]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يرجى تسجيل الدخول للمتابعة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const userMessage = message;
    setMessage("");
    
    // Add user message to conversation
    setConversation(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-idea', {
        body: { 
          ideaText: userMessage,
          analysisType: 'ai_chat',
          language: 'ar'
        }
      });

      if (error) throw error;

      // Add AI response to conversation
      setConversation(prev => [...prev, { 
        role: "assistant", 
        content: data.analysis_result?.response || "عذراً، حدث خطأ في المعالجة. يرجى المحاولة مرة أخرى."
      }]);

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ في الإرسال",
        description: "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-30" />
        <div className="container mx-auto relative z-10">
          <div className="text-center space-y-6 mb-12">
            <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto shadow-glow">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              مساعدك الذكي في
              <span className="bg-gradient-primary bg-clip-text text-transparent block">
                الوقت الفعلي
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              احصل على إجابات فورية، تحليل الأفكار التجارية، نصائح مالية وتقنية، وكل ما تحتاجه من مساعدة ذكية على مدار الساعة
            </p>
            
            {!user && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="hero" size="lg">
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="premium" size="lg">
                    <UserPlus className="w-5 h-5" />
                    إنشاء حساب
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {user && (
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-end mb-4">
                <Link to="/history">
                  <Button variant="outline" size="sm">
                    <History className="w-4 h-4" />
                    تحليلاتي السابقة
                  </Button>
                </Link>
              </div>
              
              {/* Chat Interface */}
              <Card className="bg-background/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  {/* Conversation Display */}
                  <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-gradient-glow rounded-lg">
                    {conversation.map((msg, index) => (
                      <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-gradient-primary text-primary-foreground ml-12' 
                            : 'bg-background border border-border mr-12'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {msg.role === 'assistant' ? (
                              <Brain className="w-4 h-4 text-primary" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                            <span className="text-xs font-medium">
                              {msg.role === 'assistant' ? 'Snapway AI' : 'أنت'}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] p-3 rounded-lg bg-background border border-border mr-12">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-xs font-medium">Snapway AI</span>
                          </div>
                          <div className="flex gap-1 mt-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال)"
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={loading || !message.trim()}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">مزايا Snapway AI</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              مساعد ذكي متطور يقدم لك المساعدة في جميع جوانب الأعمال والحياة
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-glow hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">ذكاء اصطناعي متقدم</h3>
              <p className="text-muted-foreground">
                نماذج ذكية حديثة تفهم السياق وتقدم إجابات دقيقة ومفيدة
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-glow hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">استجابة فورية</h3>
              <p className="text-muted-foreground">
                احصل على إجابات سريعة ودقيقة في الوقت الفعلي دون انتظار
              </p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-gradient-glow hover:shadow-glow transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">محادثة طبيعية</h3>
              <p className="text-muted-foreground">
                تفاعل طبيعي باللغة العربية مع فهم عميق للسياق والمعنى
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;