-- Add social media settings to contact_settings
INSERT INTO public.contact_settings (setting_key, setting_value) VALUES
('facebook', ''),
('twitter', ''),
('instagram', ''),
('linkedin', ''),
('youtube', ''),
('whatsapp', ''),
('telegram', ''),
('snapchat', '')
ON CONFLICT (setting_key) DO NOTHING;