-- Create products table for AI products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('website', 'image', 'analysis')),
  price DECIMAL(10,2),
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage products" 
ON public.products 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Create AI models table
CREATE TABLE public.ai_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openrouter',
  model_id TEXT NOT NULL,
  description TEXT,
  context_length INTEGER,
  input_cost DECIMAL(10,8),
  output_cost DECIMAL(10,8),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active models" 
ON public.ai_models 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage models" 
ON public.ai_models 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Insert some sample OpenRouter models
INSERT INTO public.ai_models (name, model_id, description, context_length, input_cost, output_cost) VALUES
('GPT-4 Turbo', 'openai/gpt-4-turbo', 'Most capable GPT-4 model', 128000, 0.00001, 0.00003),
('GPT-3.5 Turbo', 'openai/gpt-3.5-turbo', 'Fast and efficient model', 16384, 0.0000005, 0.0000015),
('Claude 3 Opus', 'anthropic/claude-3-opus', 'Most powerful Claude model', 200000, 0.000015, 0.000075),
('Claude 3 Sonnet', 'anthropic/claude-3-sonnet', 'Balanced Claude model', 200000, 0.000003, 0.000015),
('Llama 3 70B', 'meta-llama/llama-3-70b-instruct', 'Open source model', 8192, 0.00000059, 0.00000079);

-- Create trigger for updating timestamps
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();