package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.TrackComment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrackCommentRepository extends JpaRepository<TrackComment, UUID> {

    @EntityGraph(attributePaths = {"author"})
    List<TrackComment> findByTrackIdOrderByCreatedAtAsc(UUID trackId);

    Optional<TrackComment> findByIdAndTrackId(UUID id, UUID trackId);

    @EntityGraph(attributePaths = {"author"})
    Optional<TrackComment> findTopByTrackIdOrderByCreatedAtDescIdDesc(UUID trackId);

    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT tc FROM TrackComment tc WHERE tc.track.id IN :trackIds AND tc.createdAt = (SELECT MAX(tc2.createdAt) FROM TrackComment tc2 WHERE tc2.track.id = tc.track.id) AND tc.id = (SELECT MIN(tc3.id) FROM TrackComment tc3 WHERE tc3.track.id = tc.track.id AND tc3.createdAt = (SELECT MAX(tc4.createdAt) FROM TrackComment tc4 WHERE tc4.track.id = tc.track.id))")
    List<TrackComment> findLatestByTrackIds(@Param("trackIds") List<UUID> trackIds);
}
