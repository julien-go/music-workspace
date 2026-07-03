package com.musicworkspace.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

class CorsConfigTest {

    private final CorsConfig corsConfig = new CorsConfig();

    @Test
    void blankOrigin_failsFastWithExplicitMessage() {
        assertThatThrownBy(() -> corsConfig.corsConfigurationSource(""))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("FRONTEND_URL is not set");
    }

    @Test
    void wildcardOrigin_isRejected() {
        assertThatThrownBy(() -> corsConfig.corsConfigurationSource("*"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Wildcard");
    }

    @Test
    void validOrigin_configuresCredentialedCorsOnApiPaths() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");

        CorsConfiguration config = corsConfig
                .corsConfigurationSource("https://app.example.com")
                .getCorsConfiguration(request);

        assertThat(config).isNotNull();
        assertThat(config.getAllowedOrigins()).containsExactly("https://app.example.com");
        assertThat(config.getAllowCredentials()).isTrue();
        assertThat(config.getAllowedMethods()).contains("PATCH", "OPTIONS");
    }
}
