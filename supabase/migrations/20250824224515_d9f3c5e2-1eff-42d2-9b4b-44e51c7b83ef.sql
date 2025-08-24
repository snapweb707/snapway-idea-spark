-- Fix the ambiguous column reference in increment_daily_usage function
CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_user_id uuid, p_usage_type text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_count INTEGER;
  limit_value INTEGER;
  setting_key_var TEXT;
  column_name TEXT;
BEGIN
  -- Determine which usage type we're checking
  IF p_usage_type = 'analysis' THEN
    setting_key_var := 'daily_analysis_limit';
    column_name := 'analysis_count';
  ELSIF p_usage_type = 'marketing_plan' THEN
    setting_key_var := 'daily_marketing_plan_limit';
    column_name := 'marketing_plan_count';
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid usage type');
  END IF;

  -- Get the current limit (fixed ambiguous column reference)
  SELECT COALESCE(admin_settings.setting_value::INTEGER, 5) INTO limit_value
  FROM admin_settings 
  WHERE admin_settings.setting_key = setting_key_var;

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
$function$