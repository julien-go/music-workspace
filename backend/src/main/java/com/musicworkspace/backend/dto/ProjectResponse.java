package com.musicworkspace.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String name,
        String description,
        String coverUrl,
        UserSummary owner,
        Instant createdAt,
        Instant updatedAt
) {
}
