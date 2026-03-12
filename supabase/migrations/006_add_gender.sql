-- ==========================================
-- マイグレーション: reservationsテーブルに性別を追加
-- ==========================================

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS guest_gender TEXT;
