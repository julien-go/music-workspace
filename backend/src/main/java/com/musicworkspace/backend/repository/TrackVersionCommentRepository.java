package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.TrackVersionComment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrackVersionCommentRepository extends JpaRepository<TrackVersionComment, UUID> {

    @EntityGraph(attributePaths = {"author"})
    List<TrackVersionComment> findByTrackVersionIdOrderByCreatedAtAsc(UUID trackVersionId);

    Optional<TrackVersionComment> findByIdAndTrackVersionId(UUID id, UUID trackVersionId);
}
