-- Create contact_messages table for storing contact form submissions
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'unread'::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_messages
CREATE POLICY "Only admins can view contact messages" 
ON public.contact_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "Only admins can update contact messages" 
ON public.contact_messages 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "Anyone can insert contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Create contact_settings table for editable contact page content
CREATE TABLE public.contact_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_settings
CREATE POLICY "Anyone can view contact settings" 
ON public.contact_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage contact settings" 
ON public.contact_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Insert default contact settings
INSERT INTO public.contact_settings (setting_key, setting_value) VALUES
('email', 'info@snapway.com'),
('phone', '+966 50 123 4567'),
('address', 'الرياض، المملكة العربية السعودية'),
('hours', 'على مدار السة'),
('company_name', 'سناب واي'),
('company_description', 'مقر الشركة الرئيسي');

-- Create trigger for updating updated_at column on contact_messages
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at column on contact_settings
CREATE TRIGGER update_contact_settings_updated_at
  BEFORE UPDATE ON public.contact_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();