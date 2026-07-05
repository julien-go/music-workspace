package com.musicworkspace.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicworkspace.backend.config.CloudinaryTestMockConfig;
import com.musicworkspace.backend.config.PostgresTestContainer;
import com.musicworkspace.backend.dto.LoginRequest;
import com.musicworkspace.backend.dto.RegisterRequest;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.repository.UserRepository;
import com.musicworkspace.backend.security.CookieService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Full-stack auth flow over a real Postgres (Testcontainers): the whole
 * security chain, JWT filter and Flyway-migrated schema run for real — only
 * Cloudinary is mocked. Complements the sliced {@code AuthControllerTest}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(CloudinaryTestMockConfig.class)
class AuthFlowIntegrationTest extends PostgresTestContainer {

    private static final String EMAIL = "alice@example.com";
    private static final String USERNAME = "alice_dev";
    private static final String PASSWORD = "Password1!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @AfterEach
    void cleanUp() {
        userRepository.deleteAll();
    }

    @Test
    void register_persistsHashedUser_thenCookieAuthenticatesMe() throws Exception {
        RegisterRequest register = new RegisterRequest(EMAIL, USERNAME, PASSWORD);

        MvcResult registered = mockMvc.perform(post("/api/v1/auth/register")
                        .header("X-Forwarded-For", "10.0.0.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("jwt=")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=Lax")))
                .andExpect(jsonPath("$.user.email").value(EMAIL))
                .andExpect(jsonPath("$.user.username").value(USERNAME))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andReturn();

        // Actually committed to Postgres, with the password hashed — never stored in clear.
        User stored = userRepository.findByEmail(EMAIL).orElseThrow();
        assertThat(stored.getUsername()).isEqualTo(USERNAME);
        assertThat(stored.getPassword()).isNotEqualTo(PASSWORD);
        assertThat(passwordEncoder.matches(PASSWORD, stored.getPassword())).isTrue();

        // The issued cookie authenticates a protected endpoint end-to-end
        // (JwtAuthenticationFilter -> security chain -> AuthService).
        mockMvc.perform(get("/api/v1/auth/me").cookie(jwtCookie(registered)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.username").value(USERNAME));
    }

    @Test
    void login_afterRegister_returnsCookieForSameUser() throws Exception {
        registerUser("10.0.0.2");

        MvcResult loggedIn = mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "10.0.0.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL, PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("jwt=")))
                .andExpect(jsonPath("$.user.email").value(EMAIL))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andReturn();

        mockMvc.perform(get("/api/v1/auth/me").cookie(jwtCookie(loggedIn)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(USERNAME));
    }

    @Test
    void login_withWrongPassword_isUnauthorized() throws Exception {
        registerUser("10.0.0.3");

        mockMvc.perform(post("/api/v1/auth/login")
                        .header("X-Forwarded-For", "10.0.0.3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL, "Wrong1!pass"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void me_withoutCookie_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    private void registerUser(String clientIp) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .header("X-Forwarded-For", clientIp)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RegisterRequest(EMAIL, USERNAME, PASSWORD))))
                .andExpect(status().isCreated());
    }

    // The cookie is emitted as a raw Set-Cookie header (ResponseEntity), so read
    // its value from there rather than the parsed cookie jar.
    private Cookie jwtCookie(MvcResult result) {
        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).isNotNull();
        String prefix = CookieService.JWT_COOKIE + "=";
        String afterName = setCookie.substring(prefix.length());
        return new Cookie(CookieService.JWT_COOKIE, afterName.substring(0, afterName.indexOf(';')));
    }
}
