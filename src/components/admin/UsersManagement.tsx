import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserPlus, Users, Crown } from "lucide-react";

interface User {
  id: string;
  email: string;
  created_at: string;
  display_name?: string;
  is_admin?: boolean;
}

export const UsersManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch auth users (this might not work directly, so we'll get from profiles)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, is_admin')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Transform profiles data to match User interface
      const usersData = profiles?.map(profile => ({
        id: profile.user_id,
        email: 'البريد الإلكتروني غير متوفر', // We can't access auth.users directly
        created_at: new Date().toISOString(),
        display_name: profile.display_name,
        is_admin: profile.is_admin
      })) || [];

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب المستخدمين",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
        variant: "destructive"
      });
      return;
    }

    setIsAddingAdmin(true);
    try {
      // Sign up new user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: newAdminEmail,
        password: newAdminPassword,
        options: {
          data: {
            display_name: newAdminEmail.split('@')[0]
          }
        }
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Assign admin role using the database function
        const { data: adminResult, error: adminError } = await supabase.rpc('assign_admin_role', {
          target_email: newAdminEmail,
          assigned_by_id: (await supabase.auth.getUser()).data.user?.id
        });

        if (adminError) throw adminError;

        toast({
          title: "تم بنجاح",
          description: "تم إنشاء حساب المدير بنجاح"
        });

        setNewAdminEmail('');
        setNewAdminPassword('');
        setDialogOpen(false);
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في إنشاء حساب المدير",
        variant: "destructive"
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const toggleAdminStatus = async (userEmail: string, currentAdminStatus: boolean) => {
    try {
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) return;

      let result;
      if (currentAdminStatus) {
        // Remove admin role
        result = await supabase.rpc('remove_admin_role', {
          target_email: userEmail,
          removed_by_id: currentUser.data.user.id
        });
      } else {
        // Assign admin role
        result = await supabase.rpc('assign_admin_role', {
          target_email: userEmail,
          assigned_by_id: currentUser.data.user.id
        });
      }

      if (result.error) throw result.error;

      toast({
        title: "تم بنجاح",
        description: currentAdminStatus ? "تم إزالة صلاحيات المدير" : "تم تعيين المدير بنجاح"
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling admin status:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ في تحديث صلاحيات المستخدم",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>جاري تحميل المستخدمين...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <CardTitle>إدارة المستخدمين</CardTitle>
                <CardDescription>عرض وإدارة جميع المستخدمين المسجلين</CardDescription>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  إضافة مدير جديد
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة مدير جديد</DialogTitle>
                  <DialogDescription>
                    إنشاء حساب مدير جديد مع صلاحيات كاملة
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="كلمة مرور قوية"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={addNewAdmin} disabled={isAddingAdmin}>
                    {isAddingAdmin ? "جاري الإنشاء..." : "إنشاء الحساب"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary-foreground">
                            {user.display_name?.charAt(0) || user.email.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium">
                          {user.display_name || 'مستخدم'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Badge variant="default" className="flex items-center gap-1 w-fit">
                          <Crown className="w-3 h-3" />
                          مدير
                        </Badge>
                      ) : (
                        <Badge variant="secondary">مستخدم</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAdminStatus(user.email, user.is_admin || false)}
                        className="flex items-center gap-1"
                      >
                        <Shield className="w-3 h-3" />
                        {user.is_admin ? 'إزالة المدير' : 'تعيين مدير'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};