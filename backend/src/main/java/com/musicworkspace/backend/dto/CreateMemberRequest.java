package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.ProjectRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateMemberRequest(
        @NotBlank @Email String email,
        @NotNull ProjectRole role
) {
}
