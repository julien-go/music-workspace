package com.musicworkspace.backend.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Cookie-authenticated API: the allowed origin must be one explicit URL —
 * a wildcard would let any site replay the user's session.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origin}") String allowedOrigin) {

        if (allowedOrigin == null || allowedOrigin.isBlank()) {
            throw new IllegalStateException(
                    "FRONTEND_URL is not set. In production the allowed CORS origin must be provided "
                            + "through the FRONTEND_URL environment variable (e.g. https://app.example.com).");
        }
        if (allowedOrigin.contains("*")) {
            throw new IllegalStateException(
                    "Wildcard CORS origins are not allowed: set FRONTEND_URL to the exact frontend URL.");
        }

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(allowedOrigin));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
