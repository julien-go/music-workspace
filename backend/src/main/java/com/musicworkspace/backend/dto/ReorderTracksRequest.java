package com.musicworkspace.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public record ReorderTracksRequest(
        @NotNull List<UUID> trackIds
) {
}
