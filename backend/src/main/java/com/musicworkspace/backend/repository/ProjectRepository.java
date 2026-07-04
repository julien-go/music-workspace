package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.Project;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    Optional<Project> findByIdAndIsPublicTrue(UUID id);

    @Modifying
    @Query("DELETE FROM Project p WHERE p.id = :id")
    void deleteProjectById(@Param("id") UUID id);
}
