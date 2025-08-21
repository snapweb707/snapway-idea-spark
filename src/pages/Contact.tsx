import { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message
          }
        ]);

      if (error) throw error;

      toast({
        title: t('contact.form.success'),
        description: t('contact.form.successDesc'),
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t('contact.info.email.title'),
      info: t('contact.info.email.value'),
      description: t('contact.info.email.desc')
    },
    {
      icon: Phone,
      title: t('contact.info.phone.title'),
      info: t('contact.info.phone.value'),
      description: t('contact.info.phone.desc')
    },
    {
      icon: MapPin,
      title: t('contact.info.address.title'),
      info: t('contact.info.address.value'),
      description: t('contact.info.address.desc')
    },
    {
      icon: Clock,
      title: t('contact.info.hours.title'),
      info: t('contact.info.hours.value'),
      description: t('contact.info.hours.desc')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
              <MessageSquare className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {t('contact.title')}
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl">{t('contact.form.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t('contact.form.name')}</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t('contact.form.namePlaceholder')}
                        required
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">{t('contact.form.email')}</label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('contact.form.emailPlaceholder')}
                        required
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('contact.form.subject')}</label>
                    <Input
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder={t('contact.form.subjectPlaceholder')}
                      required
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('contact.form.message')}</label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t('contact.form.messagePlaceholder')}
                      required
                      rows={6}
                      className="bg-background/50 resize-none"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      t('contact.form.sending')
                    ) : (
                      <>
                        {t('contact.form.send')}
                        <Send className="w-4 h-4 mr-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {contactInfo.map((item, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-primary font-medium mb-1">{item.info}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('contact.faq.title')}</h2>
            <p className="text-muted-foreground">{t('contact.faq.subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{t('contact.faq.howItWorks.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('contact.faq.howItWorks.answer')}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{t('contact.faq.duration.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('contact.faq.duration.answer')}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{t('contact.faq.security.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('contact.faq.security.answer')}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{t('contact.faq.save.question')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('contact.faq.save.answer')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;