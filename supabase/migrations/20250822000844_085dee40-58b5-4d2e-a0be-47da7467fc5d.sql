-- Add service_type column to services table
ALTER TABLE services 
ADD COLUMN service_type TEXT DEFAULT 'general' CHECK (service_type IN ('general', 'consultation', 'technical_support', 'business_plan', 'idea_protection'));

-- Add index for better performance
CREATE INDEX idx_services_type ON services(service_type);

-- Update existing services to have general type
UPDATE services SET service_type = 'general' WHERE service_type IS NULL;