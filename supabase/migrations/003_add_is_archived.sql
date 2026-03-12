-- Add is_archived column to reservations table
ALTER TABLE reservations 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

-- Update existing rows (optional, but good for consistency)
UPDATE reservations SET is_archived = FALSE WHERE is_archived IS NULL;

-- Create index for faster filtering
CREATE INDEX idx_reservations_is_archived ON reservations(is_archived);
