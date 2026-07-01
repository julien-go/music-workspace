ALTER TABLE track_versions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
UPDATE track_versions SET updated_at = created_at;
