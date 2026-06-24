package com.musicworkspace.backend.dto;

import java.time.Instant;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        String content,
        UserSummary author,
        Instant createdAt
) {
}
