package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(
        @NotNull ProjectRole role
) {
}
