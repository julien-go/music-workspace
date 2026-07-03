package com.musicworkspace.backend.security;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CookieService {

    public static final String JWT_COOKIE = "jwt";

    private final JwtService jwtService;

    @Value("${app.cookie.secure}")
    private boolean secure;

    public ResponseCookie buildJwtCookie(String token) {
        return baseCookie(token)
                .maxAge(Duration.ofMillis(jwtService.getExpirationMs()))
                .build();
    }

    public ResponseCookie buildLogoutCookie() {
        return baseCookie("")
                .maxAge(0)
                .build();
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(JWT_COOKIE, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/");
    }
}
