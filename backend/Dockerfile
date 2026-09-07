# syntax=docker/dockerfile:1

# --- Build stage: compile and package the fat jar ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies: resolve them before copying sources so a code-only
# change doesn't re-download the whole tree.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
# Tests run in CI, not in the image build (they need infra we don't have here).
RUN mvn -B clean package -DskipTests

# --- Run stage: slim JRE, non-root ---
FROM eclipse-temurin:21-jre
WORKDIR /app

RUN useradd --system --user-group --home-dir /app app
COPY --from=build /app/target/backend-*.jar app.jar
USER app

# Railway injects $PORT and routes to it; server.port reads it (application.yml).
EXPOSE 8080
# Without -Xmx the JVM sizes the heap from the container's RAM (25% by default),
# which is unrelated to what this app needs. SerialGC drops the G1 region
# metadata and GC threads that dominate RSS at this heap size.
ENTRYPOINT ["java", "-Xmx320m", "-XX:+UseSerialGC", "-jar", "app.jar"]
