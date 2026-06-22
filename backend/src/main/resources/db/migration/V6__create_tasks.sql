CREATE TABLE tasks
(
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    created_by_id  UUID         NOT NULL REFERENCES users (id),
    assigned_to_id UUID                  REFERENCES users (id),
    title          VARCHAR(255) NOT NULL,
    description    TEXT,
    status         VARCHAR(50)  NOT NULL DEFAULT 'TODO',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
