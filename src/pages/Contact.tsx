import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    message: "",
    message_type: "general"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactSettings, setContactSettings] = useState<{[key: string]: string}>({});

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
            message: formData.message,
            message_type: formData.message_type
          }
        ]);

      if (error) throw error;

      toast({
        title: t('contact.form.success'),
        description: t('contact.form.successDesc'),
      });
      setFormData({ name: "", email: "", subject: "", message: "", message_type: "general" });
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

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      message_type: value
    }));
  };

  useEffect(() => {
    fetchContactSettings();
  }, []);

  const fetchContactSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_settings')
        .select('*');

      if (error) throw error;

      const settingsObj: {[key: string]: string} = {};
      data?.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value || '';
      });
      setContactSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching contact settings:', error);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "البريد الإلكتروني",
      info: contactSettings.email || t('contact.info.email.value'),
      description: "راسلنا في أي وقت"
    },
    {
      icon: Phone,
      title: "رقم الهاتف",
      info: contactSettings.phone || t('contact.info.phone.value'),
      description: "متاح 24/7"
    },
    {
      icon: MapPin,
      title: "العنوان",
      info: contactSettings.address || t('contact.info.address.value'),
      description: "مقر الشركة الرئيسي"
    },
    {
      icon: Clock,
      title: "ساعات العمل",
      info: contactSettings.hours || t('contact.info.hours.value'),
      description: "خدمة مستمرة"
    }
  ];

  const socialMediaLinks = [
    {
      icon: Facebook,
      name: "Facebook",
      url: contactSettings.facebook,
      color: "text-blue-600"
    },
    {
      icon: Twitter,
      name: "Twitter",
      url: contactSettings.twitter,
      color: "text-blue-400"
    },
    {
      icon: Instagram,
      name: "Instagram",
      url: contactSettings.instagram,
      color: "text-pink-600"
    },
    {
      icon: Linkedin,
      name: "LinkedIn",
      url: contactSettings.linkedin,
      color: "text-blue-700"
    },
    {
      icon: Youtube,
      name: "YouTube",
      url: contactSettings.youtube,
      color: "text-red-600"
    },
    {
      icon: MessageCircle,
      name: "WhatsApp",
      url: contactSettings.whatsapp ? `https://wa.me/${contactSettings.whatsapp.replace(/[^0-9]/g, '')}` : '',
      color: "text-green-600"
    }
  ].filter(social => social.url && social.url.trim());

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
                    <label className="text-sm font-medium mb-2 block">نوع الرسالة</label>
                    <Select value={formData.message_type} onValueChange={handleSelectChange}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="اختر نوع الرسالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">رسالة عامة</SelectItem>
                        <SelectItem value="service_request">طلب خدمة</SelectItem>
                        <SelectItem value="support">دعم فني</SelectItem>
                        <SelectItem value="complaint">شكوى</SelectItem>
                      </SelectContent>
                    </Select>
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
            
            {/* Social Media Links */}
            {socialMediaLinks.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">تابعنا على</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {socialMediaLinks.map((social, index) => (
                      <a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors ${social.color}`}
                      >
                        <social.icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{social.name}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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