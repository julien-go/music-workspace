package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.TrackStatus;
import java.util.List;
import java.util.UUID;

// Anonymous-facing shape: owner is a bare username and tracks carry no
// internal user IDs, members, tasks or comments.
public record PublicProjectResponse(
        UUID id,
        String name,
        String description,
        String coverUrl,
        String owner,
        List<PublicTrackResponse> tracks
) {

    public record PublicTrackResponse(
            UUID id,
            String name,
            TrackStatus status,
            int versionCount,
            String latestAudioUrl
    ) {
    }
}
