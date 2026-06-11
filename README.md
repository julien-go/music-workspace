# Music Workspace

Collaborative music project management platform — a portfolio project built to learn Spring Boot and prepare for Java CDA apprenticeships.

## Stack

- **Backend**: Java 17, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security (JWT), PostgreSQL, Flyway, Bean Validation, MapStruct, Lombok
- **Testing**: JUnit 5, Mockito, MockMvc
- **Docs**: Springdoc OpenAPI (Swagger UI)
- **Storage**: Cloudinary (audio files + cover images)
- **Infra**: Docker, Railway, GitHub Actions

## Project structure

```
music-workspace/
└── backend/   # Spring Boot REST API
```

## Getting started

### Prerequisites

- Java 17+
- PostgreSQL (or Docker)

### Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

The API docs (Swagger UI) will be available at `/swagger-ui.html` once the app is running.

## Status

Project initialization in progress — see [CLAUDE.md](CLAUDE.md) for the full roadmap.
