-- Add stay_type and check_in_time to reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS stay_type TEXT NOT NULL DEFAULT '宿泊',
  ADD COLUMN IF NOT EXISTS check_in_time TEXT; -- HH:MM 形式
