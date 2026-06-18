package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.Project;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @EntityGraph(attributePaths = {"owner"})
    List<Project> findByOwnerId(UUID ownerId);

    Optional<Project> findByIdAndOwnerId(UUID id, UUID ownerId);
}
