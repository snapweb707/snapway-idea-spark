import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Bell, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Calendar 
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target_url?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

const NotificationsManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNotification, setNewNotification] = useState<{
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    target_url: string;
  }>({
    title: "",
    message: "",
    type: "info",
    target_url: ""
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const createNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: "خطأ",
        description: "يرجى ملء العنوان والرسالة",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          ...newNotification,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الإشعار بنجاح"
      });

      setNewNotification({
        title: "",
        message: "",
        type: "info",
        target_url: ""
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء الإشعار",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNotificationStatus = async (notificationId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_active: !isActive })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: `تم ${!isActive ? 'تفعيل' : 'إلغاء تفعيل'} الإشعار`
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث الإشعار",
        variant: "destructive"
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف الإشعار بنجاح"
      });

      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف الإشعار",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إنشاء إشعار جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={newNotification.title}
                onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان الإشعار"
              />
            </div>
            <div>
              <Label htmlFor="type">نوع الإشعار</Label>
              <Select
                value={newNotification.type}
                onValueChange={(value: 'info' | 'success' | 'warning' | 'error') => 
                  setNewNotification(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">معلومات</SelectItem>
                  <SelectItem value="success">نجاح</SelectItem>
                  <SelectItem value="warning">تحذير</SelectItem>
                  <SelectItem value="error">خطأ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="message">الرسالة</Label>
            <Textarea
              id="message"
              value={newNotification.message}
              onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
              placeholder="نص الإشعار"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="target_url">الرابط (اختياري)</Label>
            <Input
              id="target_url"
              value={newNotification.target_url}
              onChange={(e) => setNewNotification(prev => ({ ...prev, target_url: e.target.value }))}
              placeholder="/about أو https://example.com"
            />
          </div>
          
          <Button onClick={createNotification} disabled={loading} className="w-full">
            {loading ? "جاري الإنشاء..." : "إنشاء الإشعار"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            الإشعارات الحالية ({notifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">لا توجد إشعارات</p>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Badge 
                          variant={notification.is_active ? "default" : "secondary"}
                        >
                          {notification.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                        <Badge variant="outline">
                          {notification.type === 'info' && 'معلومات'}
                          {notification.type === 'success' && 'نجاح'}
                          {notification.type === 'warning' && 'تحذير'}
                          {notification.type === 'error' && 'خطأ'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      {notification.target_url && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <ExternalLink className="w-3 h-3" />
                          {notification.target_url}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(notification.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleNotificationStatus(notification.id, notification.is_active)}
                      >
                        {notification.is_active ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                        {notification.is_active ? 'إلغاء تفعيل' : 'تفعيل'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsManagement;
