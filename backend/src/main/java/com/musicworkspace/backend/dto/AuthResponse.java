package com.musicworkspace.backend.dto;

import java.util.UUID;

public record AuthResponse(AuthUser user) {

    public record AuthUser(UUID id, String email, String username) {}
}
