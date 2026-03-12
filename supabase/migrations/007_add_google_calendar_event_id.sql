-- Add google_calendar_event_id to reservations for Google Calendar sync
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;
