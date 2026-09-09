-- Optional venue pin for map drop (WGS84). geography(location) stays for future geo queries.
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "venue_latitude" DOUBLE PRECISION;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "venue_longitude" DOUBLE PRECISION;
