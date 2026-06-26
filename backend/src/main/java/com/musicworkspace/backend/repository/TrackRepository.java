package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.Track;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackRepository extends JpaRepository<Track, UUID> {

    List<Track> findByProjectIdAndArchivedFalse(UUID projectId);

    List<Track> findByProjectIdAndArchivedTrue(UUID projectId);

    Optional<Track> findByIdAndProjectId(UUID id, UUID projectId);
}
