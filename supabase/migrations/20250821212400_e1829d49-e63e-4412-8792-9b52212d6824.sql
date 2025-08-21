-- Create table for storing user analysis history
CREATE TABLE IF NOT EXISTS public.analysis_history (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    idea_text text NOT NULL,
    analysis_result jsonb,
    analysis_type text DEFAULT 'basic',
    language text DEFAULT 'ar',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

-- Create policies for analysis history
CREATE POLICY "Users can view their own analysis history" 
ON public.analysis_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis" 
ON public.analysis_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis" 
ON public.analysis_history 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can view all analysis history
CREATE POLICY "Admins can view all analysis history" 
ON public.analysis_history 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_analysis_history_updated_at
BEFORE UPDATE ON public.analysis_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();