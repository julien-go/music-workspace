# Data Model

7 entities · MVP + V1 Collaboration

---

## MVP

### User

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| username | VARCHAR(100) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

> UUID over BIGINT auto-increment: sequential IDs are predictable in a public API. UUID prevents users from guessing other resources' URLs.

---

### Project

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| owner_id | UUID | FK → User, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | nullable |
| cover_url | VARCHAR(500) | nullable |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

> `owner_id` is kept on Project even with ProjectMember in V1, for fast queries without a join.

---

### Track

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → Project, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| description | TEXT | nullable |
| status | VARCHAR(50) | NOT NULL — `DRAFT` / `IN_PROGRESS` / `DONE` |
| position | INTEGER | NOT NULL, default 0 — display order among non-archived tracks |
| archived | BOOLEAN | NOT NULL, default false |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

---

### TrackVersion

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| track_id | UUID | FK → Track, NOT NULL |
| version_number | INTEGER | NOT NULL |
| audio_url | VARCHAR(500) | NOT NULL |
| notes | TEXT | nullable |
| created_at | TIMESTAMP | NOT NULL |

> `version_number` is managed by the service layer (`SELECT MAX + 1`), not a DB auto-increment. No `updated_at`: a version is immutable — never edited, a new one is created instead.

---

### Task

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → Project, NOT NULL |
| created_by_id | UUID | FK → User, NOT NULL |
| assigned_to_id | UUID | FK → User, nullable |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | nullable |
| status | VARCHAR(50) | NOT NULL — `TODO` / `DOING` / `DONE` |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

> `assigned_to_id` is nullable from the MVP to anticipate V1 without an extra migration.

---

## V1 — Collaboration

### ProjectMember

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| project_id | UUID | FK → Project, NOT NULL |
| user_id | UUID | FK → User, NOT NULL |
| role | VARCHAR(50) | NOT NULL — `OWNER` / `COLLABORATOR` / `VIEWER` |
| joined_at | TIMESTAMP | NOT NULL |

> ⚠️ `UNIQUE(project_id, user_id)` constraint required: a user can only have one role per project. Must be defined in the Flyway migration.

> When a project is created, the service automatically creates a `ProjectMember` entry with role `OWNER` for the creator.

---

### ProjectComment / TrackComment / TrackVersionComment

Three separate tables, identical structure:

| Field | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| [entity]_id | UUID | FK → target entity, NOT NULL |
| author_id | UUID | FK → User, NOT NULL |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

> Three separate tables rather than a polymorphic table with nullable columns. Cleaner, more readable, simpler to query.

---

## JPA Relations

| Relation | JPA Type | Note |
|---|---|---|
| Project → User (owner) | `@ManyToOne` | fetch LAZY |
| Track → Project | `@ManyToOne` | fetch LAZY |
| TrackVersion → Track | `@ManyToOne` | fetch LAZY |
| Task → Project | `@ManyToOne` | fetch LAZY |
| Task → User (creator) | `@ManyToOne` | fetch LAZY |
| Task → User (assignee) | `@ManyToOne` | fetch LAZY, nullable |
| ProjectMember → Project | `@ManyToOne` | fetch LAZY |
| ProjectMember → User | `@ManyToOne` | fetch LAZY |
| Comment → User (author) | `@ManyToOne` | fetch LAZY |

> ⚠️ Always LAZY: avoids uncontrolled cascade queries. EAGER would load related entities automatically on every query — risk of N+1 queries.

> No `@OneToMany` on parent entities (no `List<Track>` in `Project`). Children are fetched via their repository: `trackRepository.findByProjectId(...)`. One explicit, controlled query, only when needed.
