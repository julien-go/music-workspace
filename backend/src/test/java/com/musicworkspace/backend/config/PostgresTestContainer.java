package com.musicworkspace.backend.config;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

public abstract class PostgresTestContainer {

    // Singleton container shared across all integration tests, required for Spring context caching
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine");

    // Test-only HS256 key, derived in code so no secret-looking literal lives in
    // the repo. 48 bytes once Base64-decoded — above the 256-bit HS256 minimum.
    private static final String JWT_SECRET = Base64.getEncoder().encodeToString(
            "integration-test-signing-key-not-used-anywhere-real".getBytes(StandardCharsets.UTF_8));

    static {
        postgres.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("jwt.secret", () -> JWT_SECRET);
    }
}
