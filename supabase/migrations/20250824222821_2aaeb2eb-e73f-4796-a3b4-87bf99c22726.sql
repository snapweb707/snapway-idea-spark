-- Fix search path security warnings for existing functions
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_email text, assigned_by_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.remove_admin_role(target_email text, removed_by_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Update the increment_daily_usage function with proper search path
CREATE OR REPLACE FUNCTION public.increment_daily_usage(
  p_user_id UUID, 
  p_usage_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
  limit_value INTEGER;
  setting_key TEXT;
  column_name TEXT;
BEGIN
  -- Determine which usage type we're checking
  IF p_usage_type = 'analysis' THEN
    setting_key := 'daily_analysis_limit';
    column_name := 'analysis_count';
  ELSIF p_usage_type = 'marketing_plan' THEN
    setting_key := 'daily_marketing_plan_limit';
    column_name := 'marketing_plan_count';
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid usage type');
  END IF;

  -- Get the current limit
  SELECT COALESCE(setting_value::INTEGER, 5) INTO limit_value
  FROM admin_settings 
  WHERE setting_key = setting_key;

  -- Get or create today's usage record
  INSERT INTO daily_usage (user_id, usage_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id, usage_date) DO NOTHING;

  -- Get current count
  IF column_name = 'analysis_count' THEN
    SELECT analysis_count INTO current_count
    FROM daily_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  ELSE
    SELECT marketing_plan_count INTO current_count
    FROM daily_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  END IF;

  -- Check if limit exceeded
  IF current_count >= limit_value THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'daily_limit_exceeded',
      'current_count', current_count,
      'limit', limit_value
    );
  END IF;

  -- Increment the count
  IF column_name = 'analysis_count' THEN
    UPDATE daily_usage 
    SET analysis_count = analysis_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  ELSE
    UPDATE daily_usage 
    SET marketing_plan_count = marketing_plan_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;
  END IF;

  RETURN json_build_object(
    'success', true,
    'current_count', current_count + 1,
    'limit', limit_value
  );
END;
$$;