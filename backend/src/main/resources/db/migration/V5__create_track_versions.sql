CREATE TABLE track_versions
(
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id       UUID         NOT NULL REFERENCES tracks (id) ON DELETE CASCADE,
    version_number INTEGER      NOT NULL,
    audio_url      VARCHAR(500) NOT NULL,
    notes          TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (track_id, version_number)
);
