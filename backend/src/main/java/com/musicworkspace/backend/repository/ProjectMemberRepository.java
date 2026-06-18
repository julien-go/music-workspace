package com.musicworkspace.backend.repository;

import com.musicworkspace.backend.entity.ProjectMember;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
}
