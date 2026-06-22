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
        User user = projectAccessService.resolveUser(email);
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        if (!member.getRole().isAtLeast(requiredRole)) {
            throw new ProjectNotFoundException("Project not found");
        }

        return member.getProject();
    }

    public Track checkTrackPermission(UUID projectId, UUID trackId, String email, ProjectRole requiredRole) {
        checkProjectPermission(projectId, email, requiredRole);
        return trackRepository.findByIdAndProjectId(trackId, projectId)
                .orElseThrow(() -> new TrackNotFoundException("Track not found"));
    }

    public void checkTaskDeletePermission(UUID projectId, UUID taskCreatorId, String email) {
        User user = projectAccessService.resolveUser(email);
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));

        if (!member.getRole().isAtLeast(ProjectRole.COLLABORATOR)) {
            throw new ProjectNotFoundException("Project not found");
        }

        if (member.getRole() != ProjectRole.OWNER && !taskCreatorId.equals(user.getId())) {
            throw new TaskNotFoundException("Task not found");
        }
    }

    public User resolveUser(String email) {
        return projectAccessService.resolveUser(email);
    }
}
