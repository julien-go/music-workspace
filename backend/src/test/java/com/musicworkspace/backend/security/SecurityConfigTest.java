package com.musicworkspace.backend.security;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.musicworkspace.backend.config.AuthRateLimiter;
import com.musicworkspace.backend.controller.ProjectController;
import com.musicworkspace.backend.controller.PublicProjectController;
import com.musicworkspace.backend.dto.PublicProjectResponse;
import com.musicworkspace.backend.service.ProjectService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.Cookie;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Verifies the security layer itself with filters enabled: protected requests
 * without a valid token get the documented 401 JSON (not Spring's default 403
 * empty body — the frontend redirects to /login on 401 only), while permitAll
 * routes like /public/** stay reachable anonymously.
 */
@WebMvcTest({ProjectController.class, PublicProjectController.class})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, RestAuthenticationEntryPoint.class,
        OriginValidationFilter.class})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private AuthRateLimiter authRateLimiter;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Test
    void protectedEndpointWithoutToken_returns401Json() throws Exception {
        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void protectedEndpointWithInvalidToken_returns401Json() throws Exception {
        when(jwtService.extractSubject(anyString())).thenThrow(new JwtException("invalid token"));

        mockMvc.perform(get("/api/v1/projects").cookie(new Cookie("jwt", "garbage")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void publicEndpointWithoutToken_isPermittedBySecurity() throws Exception {
        UUID projectId = UUID.randomUUID();
        when(projectService.findPublic(projectId)).thenReturn(
                new PublicProjectResponse(projectId, "My Album", null, null, "john", List.of()));

        mockMvc.perform(get("/api/v1/public/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.owner").value("john"));
    }
}
