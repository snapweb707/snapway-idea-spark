-- Fix critical security issue: Restrict project_ideas access to owners only

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view ideas" ON public.project_ideas;
DROP POLICY IF EXISTS "Anyone can update ideas" ON public.project_ideas;
DROP POLICY IF EXISTS "Anyone can insert ideas" ON public.project_ideas;

-- Create secure policies that restrict access to idea owners only
CREATE POLICY "Users can view their own ideas" 
ON public.project_ideas 
FOR SELECT 
USING (
  CASE 
    WHEN user_id IS NULL THEN false  -- Reject ideas without user_id
    ELSE auth.uid() = user_id        -- Only allow users to see their own ideas
  END
);

CREATE POLICY "Users can insert their own ideas" 
ON public.project_ideas 
FOR INSERT 
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NULL THEN user_id IS NULL  -- Allow anonymous submissions
    ELSE auth.uid() = user_id                     -- Authenticated users must own their ideas
  END
);

CREATE POLICY "Users can update their own ideas" 
ON public.project_ideas 
FOR UPDATE 
USING (
  CASE 
    WHEN user_id IS NULL THEN false  -- Don't allow updates to anonymous ideas
    ELSE auth.uid() = user_id        -- Only allow users to update their own ideas
  END
);

-- Allow admins to view all ideas for management purposes
CREATE POLICY "Admins can manage all ideas" 
ON public.project_ideas 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);