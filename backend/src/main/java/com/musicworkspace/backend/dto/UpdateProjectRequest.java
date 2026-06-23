package com.musicworkspace.backend.dto;

import jakarta.validation.constraints.Size;

public record UpdateProjectRequest(
        @Size(min = 1, max = 255) String name,
        String description
) {
}
