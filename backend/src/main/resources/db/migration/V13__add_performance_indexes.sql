-- Postgres does not auto-create indexes on FK columns. These back the hot
-- list/lookup paths that filter by the FK (dashboard, task/comment lists).

CREATE INDEX idx_project_members_user_id ON project_members (user_id);
CREATE INDEX idx_tasks_project_id ON tasks (project_id);
CREATE INDEX idx_track_comments_track_id ON track_comments (track_id);
CREATE INDEX idx_project_comments_project_id ON project_comments (project_id);
CREATE INDEX idx_track_version_comments_track_version_id ON track_version_comments (track_version_id);

-- Covers the archived-track list (V9's partial index only covers archived = false)
-- and serves the position ordering without an extra sort.
CREATE INDEX idx_tracks_project_archived_position ON tracks (project_id, archived, position);
