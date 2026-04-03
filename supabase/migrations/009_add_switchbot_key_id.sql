-- Add SwitchBot key ID for automatic key deletion when reservation is deleted
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS switchbot_key_id INTEGER;
