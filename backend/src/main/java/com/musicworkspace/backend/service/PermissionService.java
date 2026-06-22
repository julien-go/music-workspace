package com.musicworkspace.backend.service;

import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.TaskNotFoundException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.TrackRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final ProjectMemberRepository projectMemberRepository;
    private final TrackRepository trackRepository;
    private final ProjectAccessService projectAccessService;

    public Project checkProjectPermission(UUID projectId, String email, ProjectRole requiredRole) {
        return resolveMembership(projectId, email, requiredRole).getProject();
    }

    public Track checkTrackPermission(UUID projectId, UUID trackId, String email, ProjectRole requiredRole) {
        checkProjectPermission(projectId, email, requiredRole);
        return trackRepository.findByIdAndProjectId(trackId, projectId)
                .orElseThrow(() -> new TrackNotFoundException("Track not found"));
    }

    public void checkTaskDeletePermission(ProjectRole callerRole, UUID callerUserId, UUID taskCreatorId) {
        if (callerRole != ProjectRole.OWNER && !taskCreatorId.equals(callerUserId)) {
            throw new TaskNotFoundException("Task not found");
        }
    }

    public ProjectMember resolveMembership(UUID projectId, String email, ProjectRole requiredRole) {
        User user = projectAccessService.resolveUser(email);
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        if (!member.getRole().isAtLeast(requiredRole)) {
            throw new ProjectNotFoundException("Project not found");
        }

        return member;
    }

    public User resolveUser(String email) {
        return projectAccessService.resolveUser(email);
    }
}
