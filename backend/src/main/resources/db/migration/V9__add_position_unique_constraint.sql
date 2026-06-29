CREATE UNIQUE INDEX uq_tracks_project_position_active
    ON tracks (project_id, position)
    WHERE archived = false;
