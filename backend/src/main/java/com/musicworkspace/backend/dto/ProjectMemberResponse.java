package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.ProjectRole;
import java.time.Instant;
import java.util.UUID;

public record ProjectMemberResponse(
        UUID id,
        UserSummary user,
        ProjectRole role,
        Instant joinedAt
) {
}
