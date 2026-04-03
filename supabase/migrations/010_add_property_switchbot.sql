-- Add SwitchBot keypad device ID per property
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS switchbot_keypad_device_id TEXT;
