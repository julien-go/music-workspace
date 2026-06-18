package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.TrackStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTrackRequest(
        @NotBlank @Size(max = 255) String name,
        String description,
        TrackStatus status
) {
}
