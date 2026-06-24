package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.TrackComment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackCommentRepository extends JpaRepository<TrackComment, UUID> {

    @EntityGraph(attributePaths = {"author"})
    List<TrackComment> findByTrackIdOrderByCreatedAtAsc(UUID trackId);

    Optional<TrackComment> findByIdAndTrackId(UUID id, UUID trackId);
}
