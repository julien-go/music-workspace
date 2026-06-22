package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.TaskStatus;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.openapitools.jackson.nullable.JsonNullable;

public record UpdateTaskRequest(
        @Size(min = 1, max = 255) String title,
        JsonNullable<String> description,
        TaskStatus status,
        JsonNullable<UUID> assignedToId
) {
}
