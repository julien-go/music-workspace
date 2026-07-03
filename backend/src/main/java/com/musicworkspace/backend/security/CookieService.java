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

    // Lax everywhere: dev is same-origin via the Vite proxy, prod stays
    // first-party through the Netlify proxy (see netlify.toml). Switch to None
    // + Secure only if the frontend ever calls the API cross-site — CSRF then
    // rests on OriginValidationFilter alone.
    @Value("${app.cookie.same-site:Lax}")
    private String sameSite;

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
                .sameSite(sameSite)
                .path("/");
    }
}
