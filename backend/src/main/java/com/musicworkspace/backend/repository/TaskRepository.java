package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.Task;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    @EntityGraph(attributePaths = {"createdBy", "assignedTo"})
    List<Task> findByProjectId(UUID projectId);

    @EntityGraph(attributePaths = {"createdBy", "assignedTo"})
    Optional<Task> findByIdAndProjectId(UUID id, UUID projectId);
}
