ALTER TABLE tracks ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

UPDATE tracks t
SET position = sub.rn
FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at ASC) - 1 AS rn
    FROM tracks
) sub
WHERE t.id = sub.id;
