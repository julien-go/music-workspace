package com.musicworkspace.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank String title,
        String description,
        UUID assignedToId
) {
}
