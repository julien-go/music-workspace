package com.musicworkspace.backend.dto;

public record AuthResponse(
        String token,
        String type,
        // milliseconds, matches jwt.expiration-ms
        long expiresIn
) {
}
