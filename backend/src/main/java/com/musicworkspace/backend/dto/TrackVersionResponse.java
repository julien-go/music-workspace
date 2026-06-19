package com.musicworkspace.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record TrackVersionResponse(
        UUID id,
        UUID trackId,
        int versionNumber,
        String audioUrl,
        String notes,
        Instant createdAt
) {
}
