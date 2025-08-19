-- Insert admin user profile (you'll need to sign up with this email first)
INSERT INTO public.profiles (user_id, display_name, is_admin) 
VALUES (
  '00000000-0000-0000-0000-000000000000', -- This will be updated when you actually sign up
  'Super Admin',
  true
) ON CONFLICT (user_id) DO UPDATE SET is_admin = true;

-- Update the handle_new_user function to automatically make the admin email an admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, is_admin)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'display_name',
    CASE 
      WHEN NEW.email = 'admin@snapway.com' THEN true
      ELSE false
    END
  );
  RETURN NEW;
END;
$$;