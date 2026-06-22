package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.ProjectRole;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateMemberRequest(
        @NotNull UUID userId,
        @NotNull ProjectRole role
) {
}
