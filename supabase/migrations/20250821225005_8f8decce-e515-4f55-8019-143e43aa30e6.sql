-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_url TEXT, -- Optional URL for navigation
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active notifications
CREATE POLICY "Anyone can view active notifications" 
ON public.notifications 
FOR SELECT 
USING (is_active = true);

-- Policy: Only admins can manage notifications
CREATE POLICY "Only admins can manage notifications" 
ON public.notifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Add trigger for timestamps
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample notifications
INSERT INTO public.notifications (title, message, type, target_url) VALUES
('مرحباً بكم في Snapway', 'منصة تحليل الأفكار التجارية بالذكاء الاصطناعي', 'info', '/'),
('ميزة جديدة: تحميل PDF', 'يمكنكم الآن تحميل تحليلاتكم كملف PDF', 'success', '/history'),
('دعم الجوال متاح', 'جربوا التطبيق على هواتفكم المحمولة', 'info', '/about');