-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT false,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active services" 
ON public.services 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage services" 
ON public.services 
FOR ALL 
USING (EXISTS ( 
  SELECT 1
  FROM profiles
  WHERE (profiles.user_id = auth.uid()) AND (profiles.is_admin = true)
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default services
INSERT INTO public.services (title, description, price, features, icon, is_free) VALUES
('تحليل فكرة المشروع', 'تحليل شامل لفكرة مشروعك التجاري باستخدام الذكاء الاصطناعي', 0, '["تحليل السوق", "تقييم الجدوى", "نقاط القوة والضعف", "التوصيات"]', 'BarChart3', true),
('استشارة تسويقية', 'استشارة متخصصة في التسويق الرقمي واستراتيجيات النمو', 50, '["تحليل الجمهور المستهدف", "استراتيجية التسويق", "خطة المحتوى", "تحليل المنافسين"]', 'TrendingUp', false),
('تطوير نموذج العمل', 'تطوير وتحسين نموذج العمل الخاص بمشروعك', 100, '["Business Model Canvas", "استراتيجية الإيرادات", "تحليل التكاليف", "خطة النمو"]', 'Building', false);