-- CivicLens Database Initialization
-- PostGIS extension for geospatial queries

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create geometry columns helper
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE civiclens TO postgres;
