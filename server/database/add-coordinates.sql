-- Add geographic coordinates to cdn_nodes table
USE cdn_management;

-- Add latitude and longitude columns
ALTER TABLE cdn_nodes 
ADD COLUMN latitude DECIMAL(10, 8) NULL,
ADD COLUMN longitude DECIMAL(11, 8) NULL;

-- Update existing nodes with coordinates based on location
UPDATE cdn_nodes SET 
  latitude = 21.0285, 
  longitude = 105.8542 
WHERE location LIKE '%Hanoi%' OR location LIKE '%Hanoi, Asia%';

UPDATE cdn_nodes SET 
  latitude = 10.8231, 
  longitude = 106.6297 
WHERE location LIKE '%Ho Chi Minh%' OR location LIKE '%Ho Chi Minh City%' OR location LIKE '%Test Location%';

UPDATE cdn_nodes SET 
  latitude = 16.0544, 
  longitude = 108.2022 
WHERE location LIKE '%Da Nang%' OR location LIKE '%Da Nang, Asia%';

UPDATE cdn_nodes SET 
  latitude = 10.0452, 
  longitude = 105.7469 
WHERE location LIKE '%Can Tho%' OR location LIKE '%Can Tho, Asia%';

UPDATE cdn_nodes SET 
  latitude = 20.8449, 
  longitude = 106.6881 
WHERE location LIKE '%Hai Phong%' OR location LIKE '%Hai Phong, Asia%';

-- Set default coordinates for nodes without specific location
UPDATE cdn_nodes SET 
  latitude = 16.0475, 
  longitude = 108.2062 
WHERE latitude IS NULL OR longitude IS NULL;

-- Verify the updates
SELECT id, name, location, latitude, longitude FROM cdn_nodes; 