-- Fix security issues by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid AND is_admin = true
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.assign_admin_role(target_email TEXT, assigned_by_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  result JSON;
BEGIN
  -- Check if assigner is admin
  IF NOT public.is_admin(assigned_by_id) THEN
    RETURN json_build_object('success', false, 'error', 'غير مصرح لك بتعيين المديرين');
  END IF;

  -- Get target user ID
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'المستخدم غير موجود');
  END IF;

  -- Update profiles table
  UPDATE public.profiles 
  SET is_admin = true, updated_at = now()
  WHERE user_id = target_user_id;

  -- Insert into user_roles if not exists
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, 'admin', assigned_by_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object('success', true, 'message', 'تم تعيين المدير بنجاح');
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_admin_role(target_email TEXT, removed_by_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  result JSON;
BEGIN
  -- Check if remover is admin
  IF NOT public.is_admin(removed_by_id) THEN
    RETURN json_build_object('success', false, 'error', 'غير مصرح لك بإزالة المديرين');
  END IF;

  -- Get target user ID
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'المستخدم غير موجود');
  END IF;

  -- Prevent removing own admin access
  IF target_user_id = removed_by_id THEN
    RETURN json_build_object('success', false, 'error', 'لا يمكنك إزالة صلاحياتك الإدارية');
  END IF;

  -- Update profiles table
  UPDATE public.profiles 
  SET is_admin = false, updated_at = now()
  WHERE user_id = target_user_id;

  -- Remove from user_roles
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = 'admin';

  RETURN json_build_object('success', true, 'message', 'تم إزالة صلاحيات المدير بنجاح');
END;
$$;