package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.ProjectComment;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectCommentRepository extends JpaRepository<ProjectComment, UUID> {

    @EntityGraph(attributePaths = {"author"})
    List<ProjectComment> findByProjectIdOrderByCreatedAtAsc(UUID projectId);

    Optional<ProjectComment> findByIdAndProjectId(UUID id, UUID projectId);
}
