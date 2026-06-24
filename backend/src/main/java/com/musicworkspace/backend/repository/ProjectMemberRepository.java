package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.ProjectMember;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    @EntityGraph(attributePaths = {"user"})
    List<ProjectMember> findByProjectId(UUID projectId);

    @EntityGraph(attributePaths = {"project"})
    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
}
