-- Add check-in/check-out dates to reservations
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS check_in_date DATE,
ADD COLUMN IF NOT EXISTS check_out_date DATE;

COMMENT ON COLUMN reservations.check_in_date IS 'Guest check-in date';
COMMENT ON COLUMN reservations.check_out_date IS 'Guest check-out date';
