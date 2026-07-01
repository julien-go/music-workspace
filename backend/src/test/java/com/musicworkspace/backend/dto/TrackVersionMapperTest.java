package com.musicworkspace.backend.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackVersion;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class TrackVersionMapperTest {

    private final TrackVersionMapper mapper = Mappers.getMapper(TrackVersionMapper.class);

    @Test
    void toResponse_mapsTrackIdFromNestedEntity() {
        Track track = Track.builder().id(UUID.randomUUID()).build();

        TrackVersion version = TrackVersion.builder()
                .id(UUID.randomUUID())
                .track(track)
                .versionNumber(3)
                .audioUrl("https://cloudinary.com/v3.mp3")
                .notes("Third take")
                .label("Final mix")
                .originalFileName("intro-v3.wav")
                .updatedAt(Instant.parse("2024-02-01T00:00:00Z"))
                .build();

        TrackVersionResponse response = mapper.toResponse(version);

        assertThat(response.trackId()).isEqualTo(track.getId());
        assertThat(response.versionNumber()).isEqualTo(3);
        assertThat(response.audioUrl()).isEqualTo("https://cloudinary.com/v3.mp3");
        assertThat(response.notes()).isEqualTo("Third take");
        assertThat(response.label()).isEqualTo("Final mix");
        assertThat(response.originalFileName()).isEqualTo("intro-v3.wav");
        assertThat(response.updatedAt()).isEqualTo(Instant.parse("2024-02-01T00:00:00Z"));
    }
}
