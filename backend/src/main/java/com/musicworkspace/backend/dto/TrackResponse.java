package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.TrackStatus;
import java.time.Instant;
import java.util.UUID;

public record TrackResponse(
        UUID id,
        String name,
        String description,
        TrackStatus status,
        boolean archived,
        Instant createdAt,
        Instant updatedAt
) {
}
