-- 宿（Property）にカレンダーAPI連携用のフィールドを追加
ALTER TABLE properties
ADD COLUMN google_calendar_id text DEFAULT NULL,
ADD COLUMN ical_url text DEFAULT NULL;
