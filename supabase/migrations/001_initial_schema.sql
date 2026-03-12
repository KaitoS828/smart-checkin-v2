-- Smart Check-in App - Initial Database Schema
-- Created: 2024
-- Description: Tables for reservations, passkeys, and WebAuthn challenges

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RESERVATIONS TABLE
-- ============================================================================
-- Stores reservation information, guest details, and door PIN
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_name TEXT,
  guest_address TEXT,
  guest_contact TEXT,
  secret_code TEXT UNIQUE NOT NULL,
  door_pin TEXT NOT NULL,
  is_checked_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reservations_secret_code ON reservations(secret_code);
CREATE INDEX idx_reservations_is_checked_in ON reservations(is_checked_in);

-- ============================================================================
-- PASSKEYS TABLE
-- ============================================================================
-- Stores WebAuthn passkey credentials
CREATE TABLE passkeys (
  id TEXT PRIMARY KEY, -- credentialID (base64url encoded)
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL, -- Base64-encoded public key
  counter BIGINT DEFAULT 0, -- Signature counter for clone detection
  transports TEXT[], -- Authenticator transports: ['internal', 'usb', 'nfc', 'ble']
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reservation_id) -- One passkey per reservation
);

-- Indexes for performance
CREATE INDEX idx_passkeys_reservation_id ON passkeys(reservation_id);

-- ============================================================================
-- CHALLENGES TABLE
-- ============================================================================
-- Stores WebAuthn challenges with 5-minute expiry
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Index for efficient cleanup
CREATE INDEX idx_challenges_expires_at ON challenges(expires_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Development policies: Allow anonymous access
-- WARNING: Tighten these policies in production!

CREATE POLICY "Allow anonymous read reservations"
  ON reservations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous insert reservations"
  ON reservations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update reservations"
  ON reservations FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous delete reservations"
  ON reservations FOR DELETE
  TO anon
  USING (true);

-- Passkeys policies
CREATE POLICY "Allow anonymous passkeys operations"
  ON passkeys FOR ALL
  TO anon
  USING (true);

-- Challenges policies
CREATE POLICY "Allow anonymous challenges operations"
  ON challenges FOR ALL
  TO anon
  USING (true);

-- ============================================================================
-- PRODUCTION RLS RECOMMENDATIONS (commented out for development)
-- ============================================================================
-- Uncomment and customize these for production deployment:

-- Admin-only reservation management (using service role key)
-- CREATE POLICY "Admin full access reservations"
--   ON reservations FOR ALL
--   TO authenticated
--   USING (auth.jwt() ->> 'role' = 'admin');

-- Guest can only update their own reservation
-- CREATE POLICY "Guest update own reservation"
--   ON reservations FOR UPDATE
--   TO anon
--   USING (id = current_setting('request.jwt.claims')::json ->> 'reservation_id'::text);

-- Passkey read only for matching reservation
-- CREATE POLICY "Read own passkey"
--   ON passkeys FOR SELECT
--   TO anon
--   USING (reservation_id = current_setting('request.jwt.claims')::json ->> 'reservation_id'::text);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE reservations IS 'Reservation data with guest information and door PIN';
COMMENT ON TABLE passkeys IS 'WebAuthn passkey credentials for biometric authentication';
COMMENT ON TABLE challenges IS 'Temporary WebAuthn challenges with 5-minute expiry';

COMMENT ON COLUMN reservations.secret_code IS 'Auto-generated secret code (format: XXX-XXX-XXX)';
COMMENT ON COLUMN reservations.door_pin IS 'Smart lock door PIN provided after check-in';
COMMENT ON COLUMN passkeys.id IS 'WebAuthn credentialID (base64url)';
COMMENT ON COLUMN passkeys.counter IS 'Signature counter for authenticator clone detection';
