-- Remove WebAuthn related tables
DROP TABLE IF EXISTS passkeys;
DROP TABLE IF EXISTS challenges;

-- Add new columns for password and whereby integration to reservations
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS whereby_room_url TEXT,
ADD COLUMN IF NOT EXISTS whereby_host_room_url TEXT;

COMMENT ON COLUMN reservations.password_hash IS 'Hashed password for guest authentication';
COMMENT ON COLUMN reservations.whereby_room_url IS 'Whereby meeting URL for the guest';
COMMENT ON COLUMN reservations.whereby_host_room_url IS 'Whereby meeting URL for the host';
