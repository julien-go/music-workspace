package com.musicworkspace.backend.dto;

import jakarta.validation.constraints.Size;

public record UpdateTrackVersionRequest(
        @Size(max = 255) String label,
        @Size(max = 5000) String notes
) {
}
