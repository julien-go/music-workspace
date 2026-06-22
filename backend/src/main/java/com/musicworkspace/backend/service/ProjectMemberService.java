package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CreateMemberRequest;
import com.musicworkspace.backend.dto.ProjectMemberMapper;
import com.musicworkspace.backend.dto.ProjectMemberResponse;
import com.musicworkspace.backend.dto.UpdateMemberRoleRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.MemberAlreadyExistsException;
import com.musicworkspace.backend.exception.MemberNotFoundException;
import com.musicworkspace.backend.exception.OwnerRoleException;
import com.musicworkspace.backend.exception.UserNotFoundException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService projectAccessService;
    private final ProjectMemberMapper projectMemberMapper;

    @Transactional
    public ProjectMemberResponse addMember(UUID projectId, CreateMemberRequest request, String email) {
        User owner = projectAccessService.resolveUser(email);
        Project project = projectAccessService.resolveOwnedProject(projectId, owner.getId());

        rejectOwnerRole(request.role());

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, request.userId())) {
            throw new MemberAlreadyExistsException("User is already a member of this project");
        }

        User newMember = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(newMember)
                .role(request.role())
                .build();

        return projectMemberMapper.toResponse(projectMemberRepository.save(member));
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> findAll(UUID projectId, String email) {
        User user = projectAccessService.resolveUser(email);
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);

        boolean isMember = members.stream()
                .anyMatch(m -> m.getUser().getId().equals(user.getId()));

        if (!isMember) {
            throw new MemberNotFoundException("Project not found");
        }

        return members.stream()
                .map(projectMemberMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProjectMemberResponse updateRole(UUID projectId, UUID memberId, UpdateMemberRoleRequest request, String email) {
        User owner = projectAccessService.resolveUser(email);
        projectAccessService.resolveOwnedProject(projectId, owner.getId());

        rejectOwnerRole(request.role());

        ProjectMember member = resolveMember(memberId, projectId);

        if (member.getRole() == ProjectRole.OWNER) {
            throw new OwnerRoleException("Cannot modify the project owner's role");
        }

        member.setRole(request.role());
        return projectMemberMapper.toResponse(projectMemberRepository.save(member));
    }

    @Transactional
    public void removeMember(UUID projectId, UUID memberId, String email) {
        User owner = projectAccessService.resolveUser(email);
        projectAccessService.resolveOwnedProject(projectId, owner.getId());

        ProjectMember member = resolveMember(memberId, projectId);

        if (member.getRole() == ProjectRole.OWNER) {
            throw new OwnerRoleException("Cannot remove the project owner");
        }

        projectMemberRepository.delete(member);
    }

    private ProjectMember resolveMember(UUID memberId, UUID projectId) {
        return projectMemberRepository.findByIdAndProjectId(memberId, projectId)
                .orElseThrow(() -> new MemberNotFoundException("Member not found"));
    }

    private void rejectOwnerRole(ProjectRole role) {
        if (role == ProjectRole.OWNER) {
            throw new OwnerRoleException("Cannot assign OWNER role");
        }
    }
}
