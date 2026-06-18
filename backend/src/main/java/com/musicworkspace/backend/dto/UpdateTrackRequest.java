package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.TrackStatus;
import jakarta.validation.constraints.Size;

public record UpdateTrackRequest(
        @Size(min = 1, max = 255) String name,
        String description,
        TrackStatus status
) {
}
