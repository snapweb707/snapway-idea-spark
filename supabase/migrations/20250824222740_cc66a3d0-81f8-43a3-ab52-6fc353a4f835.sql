-- Create daily usage tracking table
CREATE TABLE public.daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  analysis_count INTEGER NOT NULL DEFAULT 0,
  marketing_plan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own usage
CREATE POLICY "Users can view their own usage" 
ON public.daily_usage 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own usage" 
ON public.daily_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own usage" 
ON public.daily_usage 
FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can manage all usage records
CREATE POLICY "Admins can manage all usage" 
ON public.daily_usage 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Add usage limit settings to admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value, is_encrypted) 
VALUES 
  ('daily_analysis_limit', '5', false),
  ('daily_marketing_plan_limit', '2', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_daily_usage_updated_at
  BEFORE UPDATE ON public.daily_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment usage
CREATE OR REPLACE FUNCTION public.increment_daily_usage(
  p_user_id UUID, 
  p_usage_type TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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