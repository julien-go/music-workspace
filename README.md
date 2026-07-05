# Music Workspace

![Frontend CI](https://github.com/julien-go/music-workspace/actions/workflows/frontend-ci.yml/badge.svg)
![Backend CI](https://github.com/julien-go/music-workspace/actions/workflows/backend-ci.yml/badge.svg)

**Voir l'app** [https://music-workspace.netlify.app/](https://music-workspace.netlify.app/)

Une plateforme pour gérer tes projets musicaux en collab. Crée des projets, upload tes versions audio, gère les tâches et les retours avec ton équipe.

C'est un projet portfolio pour montrer une archi Spring Boot + React bien pensée, sécurisée et optimisée.

---

## Stack

**Backend**
- Java 21 + Spring Boot 3.5
- PostgreSQL + Flyway (migrations versionnées)
- MapStruct pour les DTOs, Lombok pour le boilerplate
- JWT avec cookies httpOnly, rate limiting avec Bucket4j
- Swagger UI auto-généré

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind + shadcn/ui pour l'UI
- TanStack Router et TanStack Query pour la gestion d'état
- Zod pour la validation des formulaires

**Tests & Déploiement**
- Backend : JUnit 5 + Mockito + Testcontainers (vrais tests d'intégration)
- Frontend : Vitest + Testing Library
- Cloudinary pour l'hébergement des audios et images
- Railway pour l'API, Netlify pour le frontend, GitHub Actions pour la CI

---

## Architecture

Monorepo classique avec deux apps indépendantes.

```
music-workspace/
├── backend/           # Spring Boot API REST
│   ├── controller/    # routes HTTP seulement
│   ├── service/       # toute la logique métier
│   ├── repository/    # Spring Data JPA
│   ├── entity/        # models DB
│   ├── dto/           # objets requête/réponse
│   ├── security/      # JWT, cookies, Spring Security
│   └── exception/     # gestion d'erreurs centralisée
│
├── frontend/          # React + Vite
│   ├── features/      # organisé par feature (auth, projects, tracks...)
│   ├── components/    # UI réutilisable
│   ├── lib/           # fetch wrapper, utilitaires
│   └── store/         # Zustand pour l'état global
│
├── docker-compose.yml # PostgreSQL local
├── netlify.toml       # config déploiement frontend
```

Règles de séparation: la logique vit dans les services, les contrôleurs délèguent, les repos gèrent l'accès DB. Pas d'entités exposées au client - toujours des DTOs. Les relations JPA sont LAZY par défaut.

---

## Démarrer en local

**Prérequis**
- Java 21+
- Node 20+
- Docker (ou PostgreSQL installé localement)
- Compte Cloudinary gratuit

**1. PostgreSQL**

```bash
docker compose up -d
```

**2. Backend**

```bash
cd backend
export JWT_SECRET="$(openssl rand -base64 64)"
export CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
./mvnw spring-boot:run
```

Flyway applique les migrations automatiquement. API sur http://localhost:8080, Swagger sur http://localhost:8080/swagger-ui.html

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

App sur http://localhost:5173. Le proxy dev route `/api/*` vers le backend, donc les cookies JWT restent first-party.

**Env variables (prod)**

| Var | Description |
|-----|-------------|
| `JWT_SECRET` | Clé pour signer les JWTs (base64, >= 256 bits) |
| `CLOUDINARY_URL` | `cloudinary://KEY:SECRET@CLOUD` |
| `FRONTEND_URL` | URL du frontend pour CORS |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | Connexion PostgreSQL |

---

## Commandes utiles

**Backend**
```bash
./mvnw spring-boot:run    # Dev
./mvnw clean verify       # Tests + rapport couverture
./mvnw test               # Tests seulement
```

**Frontend**
```bash
npm run dev       # Dev server
npm run build     # Production build
npm run lint      # ESLint (cyclomatic complexity limit: 15)
npm test          # Tests avec Vitest
```

---

## Fonctionnalités

- Inscription / login / logout avec JWT httpOnly
- Créer des projets, upload cover image
- Rendre un projet public (lisible pour n'importe qui)
- Créer des tracks et upload des versions audio (Cloudinary)
- Système de versions immuables (pas de modification après création)
- Tâches (TODO / DOING / DONE) avec assignation optionnelle
- Commentaires sur projets, tracks et versions
- Gestion des rôles (OWNER / COLLABORATOR / VIEWER) pour collaborer

**MVP**: user, projets, tracks, versions, tâches.
**V1**: membres avec rôles, commentaires.

---

## Modèle de données

7 entités principales, relations en LAZY par défaut.

```mermaid
erDiagram
    USER ||--o{ PROJECT : "possède"
    USER ||--o{ PROJECT_MEMBER : "membre de"
    PROJECT ||--o{ PROJECT_MEMBER : "contient"
    PROJECT ||--o{ TRACK : "contient"
    TRACK ||--o{ TRACK_VERSION : "a des versions"
    PROJECT ||--o{ TASK : "contient"
    USER ||--o{ TASK : "crée / assigne"
    PROJECT ||--o{ PROJECT_COMMENT : "contient"
    TRACK ||--o{ TRACK_COMMENT : "contient"
    TRACK_VERSION ||--o{ TRACK_VERSION_COMMENT : "contient"
    USER ||--o{ PROJECT_COMMENT : "auteur"

    USER {
        uuid id PK
        string email UK
        string username UK
        string password
        timestamp created_at
    }
    PROJECT {
        uuid id PK
        uuid owner_id FK
        string name
        string description
        string cover_url
        boolean is_public
    }
    TRACK {
        uuid id PK
        uuid project_id FK
        string name
        string status
        int position
        boolean archived
    }
    TRACK_VERSION {
        uuid id PK
        uuid track_id FK
        int version_number
        string audio_url
        string notes
        string label
    }
    TASK {
        uuid id PK
        uuid project_id FK
        uuid created_by_id FK
        uuid assigned_to_id FK
        string title
        string status
    }
    PROJECT_MEMBER {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        string role
    }
```

**Contraintes importantes**

- Emails et usernames uniques
- Un rôle par user par projet (UNIQUE(project_id, user_id))
- Suppression d'un projet supprime tout en cascade (tracks, versions, tâches, commentaires)
- Indices DB sur les colonnes fréquemment filtrées (project_id, user_id, track_id, etc.)

**Design notes**

- `version_number` est assigné par le service (SELECT MAX + 1), pas par la DB
- Les versions audio sont immuables - pas de modif après création
- Créer un projet crée automatiquement un ProjectMember OWNER pour le créateur

Voir [DATA_MODEL.md](DATA_MODEL.md) et [API_DESIGN.md](API_DESIGN.md) pour la doc complète.

---

## Flux principaux

**Créer un projet et uploader une version audio**

1. POST /projects: crée le projet, la DB insère aussi un ProjectMember OWNER
2. POST /tracks: crée une track
3. POST /versions: upload l'audio sur Cloudinary, insère la version en DB

La liste des tracks après ça se fait en une seule requête optimisée (batched projections pour les version counts et derniers commentaires).

**Authentification**

1. Register: hash du password en BCrypt, user créé
2. Login: vérif password, JWT signé et envoyé dans un cookie httpOnly
3. Requêtes suivantes: le cookie est envoyé auto, le filtre JWT le vérifie

Sur 401, le frontend nettoie l'état et redirige vers /login.

---

## Sécurité

- **Cookies httpOnly**: JWTs pas accessibles en JavaScript (protection XSS)
- **SameSite=Lax**: protection CSRF simplifiée
- **Origin validation**: requêtes d'autres domaines rejetées
- **Rate limiting**: login 5/min, register 3/min par IP
- **Validation server-side**: tous les inputs validés avec Zod + Bean Validation
- **Pas de fuite d'info**: accès denied retourne 404 (pas 403) pour ne pas confirmer l'existence d'une ressource
- **File upload**: vérification du type MIME server-side (Tika), pas juste l'extension
- **Passwords**: hashés avec BCrypt, jamais stockés en clair

---

## Production

**Frontend sur Netlify**: build auto depuis `frontend/`, proxy `/api/*` vers Railway, fallback SPA pour les routes client.

**API sur Railway**: migrations Flyway au démarrage, validation du schéma JPA (jamais d'auto-mutations DB), cookies `Secure` en HTTPS.

**DB PostgreSQL**: Railway gère la persistence, Flyway gère les versions de schéma.

**CI avec GitHub Actions**: les tests tournent à chaque push, les PRs qui cassent les tests sont bloquées.

---

## Docs

- [DATA_MODEL.md](DATA_MODEL.md) - structure des entités, contraintes, indices
- [API_DESIGN.md](API_DESIGN.md) - endpoints, format erreurs, DTOs
- [CLAUDE.md](CLAUDE.md) - règles d'archi et conventions du projet
