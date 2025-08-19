-- Insert OpenRouter API key setting if it doesn't exist
INSERT INTO admin_settings (setting_key, setting_value, is_encrypted)
VALUES ('openrouter_api_key', '', true)
ON CONFLICT (setting_key) DO NOTHING;