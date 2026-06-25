package com.musicworkspace.backend.controller;

import com.musicworkspace.backend.dto.AuthResponse;
import com.musicworkspace.backend.dto.LoginRequest;
import com.musicworkspace.backend.dto.RegisterRequest;
import com.musicworkspace.backend.dto.UserResponse;
import com.musicworkspace.backend.service.AuthService;
import com.musicworkspace.backend.service.AuthService.AuthResult;
import jakarta.validation.Valid;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String JWT_COOKIE = "jwt";

    private final AuthService authService;

    @Value("${jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.cookie.secure}")
    private boolean secureCookie;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResult result = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, buildJwtCookie(result.token()).toString())
                .body(result.response());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResult result = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, buildJwtCookie(result.token()).toString())
                .body(result.response());
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication));
    }

    private ResponseCookie buildJwtCookie(String token) {
        return ResponseCookie.from(JWT_COOKIE, token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMillis(jwtExpirationMs))
                .build();
    }
}
