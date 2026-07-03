package com.musicworkspace.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicworkspace.backend.config.AuthRateLimiter;
import com.musicworkspace.backend.security.CookieService;
import com.musicworkspace.backend.dto.AuthResponse;
import com.musicworkspace.backend.dto.AuthResponse.AuthUser;
import com.musicworkspace.backend.dto.LoginRequest;
import com.musicworkspace.backend.dto.RegisterRequest;
import com.musicworkspace.backend.dto.UserResponse;
import com.musicworkspace.backend.exception.EmailAlreadyExistsException;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.AuthService;
import com.musicworkspace.backend.service.AuthService.AuthResult;
import java.time.Instant;
import java.util.UUID;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private CookieService cookieService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private AuthRateLimiter authRateLimiter;

    private final AuthResult authResult = new AuthResult("jwt-token",
            new AuthResponse(new AuthUser(UUID.randomUUID(), "test@example.com", "testuser")));

    @BeforeEach
    void setUp() {
        when(cookieService.buildJwtCookie("jwt-token")).thenReturn(
                ResponseCookie.from("jwt", "jwt-token").httpOnly(true).sameSite("Lax").path("/").build());
        when(cookieService.buildLogoutCookie()).thenReturn(
                ResponseCookie.from("jwt", "").httpOnly(true).sameSite("Lax").path("/").maxAge(0).build());
    }

    @Test
    void register_returnsCreatedWithCookieAndAuthResponse() throws Exception {
        RegisterRequest request = new RegisterRequest("test@example.com", "testuser", "Password1!");
        when(authService.register(any(RegisterRequest.class))).thenReturn(authResult);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Set-Cookie", Matchers.containsString("jwt=jwt-token")))
                .andExpect(header().string("Set-Cookie", Matchers.containsString("HttpOnly")))
                .andExpect(header().string("Set-Cookie", Matchers.containsString("SameSite=Lax")))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.username").value("testuser"))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    void register_returnsValidationErrorOnInvalidEmail() throws Exception {
        RegisterRequest request = new RegisterRequest("not-an-email", "testuser", "Password1!");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422))
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void register_returnsConflictWhenEmailAlreadyExists() throws Exception {
        RegisterRequest request = new RegisterRequest("test@example.com", "testuser", "Password1!");
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new EmailAlreadyExistsException("Email already in use: test@example.com"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("CONFLICT"));
    }

    @Test
    void login_returnsOkWithCookieAndAuthResponse() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "Password1!");
        when(authService.login(any(LoginRequest.class))).thenReturn(authResult);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", Matchers.containsString("jwt=jwt-token")))
                .andExpect(header().string("Set-Cookie", Matchers.containsString("HttpOnly")))
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.username").value("testuser"))
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    void login_returns429WhenRateLimited() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "Password1!");
        doThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Trop de tentatives, réessaie dans un instant."))
                .when(authRateLimiter).checkLogin(any());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").value("TOO_MANY_REQUESTS"))
                .andExpect(jsonPath("$.message").value("Trop de tentatives, réessaie dans un instant."))
                .andExpect(jsonPath("$.errors").isEmpty());
    }

    @Test
    void login_returnsUnauthorizedOnBadCredentials() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "wrong-password");
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void login_returnsValidationErrorOnBlankPassword() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void logout_returnsNoContentAndClearsCookie() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isNoContent())
                .andExpect(header().string("Set-Cookie", Matchers.containsString("jwt=")))
                .andExpect(header().string("Set-Cookie", Matchers.containsString("Max-Age=0")));
    }

    @Test
    void me_returnsCurrentUserProfile() throws Exception {
        UserResponse userResponse = new UserResponse(UUID.randomUUID(), "test@example.com", "testuser", Instant.now());
        when(authService.getCurrentUser(any())).thenReturn(userResponse);

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.username").value("testuser"));
    }
}
