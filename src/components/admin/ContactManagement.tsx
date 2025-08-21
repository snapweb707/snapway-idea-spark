import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, MapPin, Clock, MessageSquare, Settings, Eye, CheckCircle } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface ContactSetting {
  setting_key: string;
  setting_value: string;
}

export const ContactManagement = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [settings, setSettings] = useState<ContactSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editedSettings, setEditedSettings] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      // Fetch contact messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Fetch contact settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('contact_settings')
        .select('*');

      if (settingsError) throw settingsError;

      setMessages(messagesData || []);
      setSettings(settingsData || []);

      // Initialize edited settings
      const settingsObj: {[key: string]: string} = {};
      settingsData?.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value || '';
      });
      setEditedSettings(settingsObj);

    } catch (error) {
      console.error('Error fetching contact data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب بيانات التواصل",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة الرسالة"
      });

      fetchContactData();
    } catch (error) {
      console.error('Error updating message status:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث حالة الرسالة",
        variant: "destructive"
      });
    }
  };

  const saveSettings = async () => {
    try {
      const updatePromises = Object.entries(editedSettings).map(([key, value]) =>
        supabase
          .from('contact_settings')
          .update({ setting_value: value })
          .eq('setting_key', key)
      );

      const results = await Promise.all(updatePromises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      toast({
        title: "تم بنجاح",
        description: "تم حفظ إعدادات التواصل بنجاح"
      });

      setSettingsDialogOpen(false);
      fetchContactData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حفظ الإعدادات",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'read') {
      return <Badge variant="default">مقروءة</Badge>;
    }
    return <Badge variant="secondary">جديدة</Badge>;
  };

  const unreadCount = messages.filter(msg => msg.status === 'unread').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>إعدادات صفحة التواصل</CardTitle>
                <CardDescription>تحرير معلومات التواصل المعروضة في الموقع</CardDescription>
              </div>
            </div>
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">تحرير الإعدادات</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>تحرير إعدادات التواصل</DialogTitle>
                  <DialogDescription>
                    قم بتحديث معلومات التواصل التي تظهر للزوار
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        value={editedSettings.email || ''}
                        onChange={(e) => setEditedSettings(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={editedSettings.phone || ''}
                        onChange={(e) => setEditedSettings(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">العنوان</Label>
                    <Input
                      id="address"
                      value={editedSettings.address || ''}
                      onChange={(e) => setEditedSettings(prev => ({
                        ...prev,
                        address: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hours">ساعات العمل</Label>
                    <Input
                      id="hours"
                      value={editedSettings.hours || ''}
                      onChange={(e) => setEditedSettings(prev => ({
                        ...prev,
                        hours: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name">اسم الشركة</Label>
                    <Input
                      id="company_name"
                      value={editedSettings.company_name || ''}
                      onChange={(e) => setEditedSettings(prev => ({
                        ...prev,
                        company_name: e.target.value
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_description">وصف الشركة</Label>
                    <Input
                      id="company_description"
                      value={editedSettings.company_description || ''}
                      onChange={(e) => setEditedSettings(prev => ({
                        ...prev,
                        company_description: e.target.value
                      }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={saveSettings}>
                    حفظ التغييرات
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Messages */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>رسائل التواصل ({messages.length})</CardTitle>
              <CardDescription>
                عرض وإدارة رسائل التواصل الواردة
                {unreadCount > 0 && (
                  <span className="text-red-600 font-medium"> - {unreadCount} رسالة جديدة</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow key={message.id} className={message.status === 'unread' ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium">{message.name}</TableCell>
                    <TableCell>{message.email}</TableCell>
                    <TableCell className="max-w-xs truncate">{message.subject}</TableCell>
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell>
                      {new Date(message.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedMessage(message)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>تفاصيل الرسالة</DialogTitle>
                            </DialogHeader>
                            {selectedMessage && (
                              <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold">الاسم:</Label>
                                    <p>{selectedMessage.name}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">البريد الإلكتروني:</Label>
                                    <p>{selectedMessage.email}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="font-semibold">الموضوع:</Label>
                                  <p>{selectedMessage.subject}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">الرسالة:</Label>
                                  <div className="mt-2 p-3 bg-muted rounded-md">
                                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="font-semibold">تاريخ الإرسال:</Label>
                                  <p>{new Date(selectedMessage.created_at).toLocaleString('ar-SA')}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        {message.status === 'unread' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(message.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {messages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      لا توجد رسائل تواصل حتى الآن
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};