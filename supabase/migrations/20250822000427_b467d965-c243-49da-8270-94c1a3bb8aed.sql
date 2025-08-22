-- Add message_type column to contact_messages table
ALTER TABLE contact_messages 
ADD COLUMN message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'service_request', 'support', 'complaint'));

-- Add index for better performance
CREATE INDEX idx_contact_messages_type ON contact_messages(message_type);

-- Update existing messages to have general type
UPDATE contact_messages SET message_type = 'general' WHERE message_type IS NULL;