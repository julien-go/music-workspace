package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.Task;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    @EntityGraph(attributePaths = {"createdBy", "assignedTo"})
    List<Task> findByProjectId(UUID projectId);

    @EntityGraph(attributePaths = {"createdBy", "assignedTo"})
    Optional<Task> findByIdAndProjectId(UUID id, UUID projectId);

    // Drop the assignee on a removed member's tasks — a task must never point to
    // someone who no longer belongs to the project.
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Task t SET t.assignedTo = null WHERE t.project.id = :projectId AND t.assignedTo.id = :userId")
    void clearAssigneeForProjectUser(@Param("projectId") UUID projectId, @Param("userId") UUID userId);
}
