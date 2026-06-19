package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.TrackVersion;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrackVersionRepository extends JpaRepository<TrackVersion, UUID> {

    List<TrackVersion> findByTrackId(UUID trackId);

    Optional<TrackVersion> findByIdAndTrackId(UUID id, UUID trackId);

    @Query("SELECT COALESCE(MAX(tv.versionNumber), 0) FROM TrackVersion tv WHERE tv.track.id = :trackId")
    int findMaxVersionNumberByTrackId(@Param("trackId") UUID trackId);
}
