package com.musicworkspace.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class OriginValidationFilterTest {

    private OriginValidationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new OriginValidationFilter("https://app.example.com", new ObjectMapper());
    }

    private MockHttpServletRequest request(String method, String origin) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, "/api/v1/projects");
        request.addHeader("Host", "api.example.com");
        if (origin != null) {
            request.addHeader("Origin", origin);
        }
        return request;
    }

    private MockHttpServletResponse run(MockHttpServletRequest request) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void mutationFromAllowedOrigin_passes() throws Exception {
        assertThat(run(request("POST", "https://app.example.com")).getStatus()).isEqualTo(200);
    }

    @Test
    void mutationFromForeignOrigin_isRejectedWith403Json() throws Exception {
        MockHttpServletResponse response = run(request("POST", "https://evil.example.org"));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("\"error\":\"FORBIDDEN\"");
    }

    @Test
    void getFromForeignOrigin_passes() throws Exception {
        assertThat(run(request("GET", "https://evil.example.org")).getStatus()).isEqualTo(200);
    }

    @Test
    void mutationWithoutOrigin_passes() throws Exception {
        assertThat(run(request("DELETE", null)).getStatus()).isEqualTo(200);
    }

    @Test
    void mutationFromApiOwnOrigin_passes() throws Exception {
        // Swagger UI served by the API posts with the API's own origin.
        assertThat(run(request("POST", "https://api.example.com")).getStatus()).isEqualTo(200);
    }

    @Test
    void sandboxedNullOrigin_isRejected() throws Exception {
        assertThat(run(request("POST", "null")).getStatus()).isEqualTo(403);
    }

    @Test
    void trailingSlashOnConfiguredOrigin_isTolerated() throws Exception {
        filter = new OriginValidationFilter("https://app.example.com/", new ObjectMapper());

        assertThat(run(request("PATCH", "https://app.example.com")).getStatus()).isEqualTo(200);
    }
}
