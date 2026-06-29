package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.Track;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrackRepository extends JpaRepository<Track, UUID> {

    List<Track> findByProjectIdAndArchivedFalseOrderByPositionAsc(UUID projectId);

    List<Track> findByProjectIdAndArchivedTrueOrderByPositionAsc(UUID projectId);

    Optional<Track> findByIdAndProjectId(UUID id, UUID projectId);

    @Query("SELECT COALESCE(MAX(t.position), -1) FROM Track t WHERE t.project.id = :projectId")
    int findMaxPositionByProjectId(@Param("projectId") UUID projectId);
}
