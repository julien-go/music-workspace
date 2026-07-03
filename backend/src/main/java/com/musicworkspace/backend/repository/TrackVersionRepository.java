package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.TrackVersion;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrackVersionRepository extends JpaRepository<TrackVersion, UUID> {

    List<TrackVersion> findByTrackIdOrderByVersionNumberDesc(UUID trackId);

    Optional<TrackVersion> findByIdAndTrackId(UUID id, UUID trackId);

    @Query("SELECT COALESCE(MAX(tv.versionNumber), 0) FROM TrackVersion tv WHERE tv.track.id = :trackId")
    int findMaxVersionNumberByTrackId(@Param("trackId") UUID trackId);

    long countByTrackId(UUID trackId);

    Optional<TrackVersion> findTopByTrackIdOrderByVersionNumberDesc(UUID trackId);

    @Query("SELECT tv.track.id AS trackId, COUNT(tv) AS count FROM TrackVersion tv WHERE tv.track.id IN :trackIds GROUP BY tv.track.id")
    List<TrackVersionCountProjection> countsByTrackIds(@Param("trackIds") List<UUID> trackIds);

    @Query("SELECT tv.track.id AS trackId, tv.notes AS notes FROM TrackVersion tv WHERE tv.track.id IN :trackIds AND tv.versionNumber = (SELECT MAX(tv2.versionNumber) FROM TrackVersion tv2 WHERE tv2.track.id = tv.track.id)")
    List<TrackVersionNotesProjection> findLatestNotesByTrackIds(@Param("trackIds") List<UUID> trackIds);

    interface TrackVersionCountProjection {
        UUID getTrackId();
        long getCount();
    }

    interface TrackVersionNotesProjection {
        UUID getTrackId();
        String getNotes();
    }
}
