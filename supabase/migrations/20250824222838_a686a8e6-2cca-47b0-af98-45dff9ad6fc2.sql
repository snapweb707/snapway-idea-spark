-- Fix the remaining function search path warning
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, is_admin)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'display_name',
    CASE 
      WHEN NEW.email = 'anasm5666@gmail.com' THEN true
      ELSE false
    END
  );
  RETURN NEW;
END;
$function$;