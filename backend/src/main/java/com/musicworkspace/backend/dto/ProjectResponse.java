package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.ProjectRole;
import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String name,
        String description,
        String coverUrl,
        boolean isPublic,
        UserSummary owner,
        ProjectRole currentUserRole,
        Instant createdAt,
        Instant updatedAt
) {
}
