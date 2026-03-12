-- Smart Check-in App - Migration 002
-- Add guest occupation and foreign national fields

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS guest_occupation TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS is_foreign_national BOOLEAN DEFAULT FALSE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS passport_number TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS passport_image_url TEXT;

COMMENT ON COLUMN reservations.guest_occupation IS '宿泊者の職業';
COMMENT ON COLUMN reservations.is_foreign_national IS '日本国内に住所を有しない外国人かどうか';
COMMENT ON COLUMN reservations.nationality IS '国籍（外国人のみ）';
COMMENT ON COLUMN reservations.passport_number IS '旅券番号（外国人のみ）';
COMMENT ON COLUMN reservations.passport_image_url IS 'パスポート画像のURL（外国人のみ）';
