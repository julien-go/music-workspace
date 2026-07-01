package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.dto.CreateMemberRequest;
import com.musicworkspace.backend.dto.ProjectMemberMapper;
import com.musicworkspace.backend.dto.ProjectMemberResponse;
import com.musicworkspace.backend.dto.UpdateMemberRoleRequest;
import com.musicworkspace.backend.dto.UserSummary;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.MemberAlreadyExistsException;
import com.musicworkspace.backend.exception.MemberNotFoundException;
import com.musicworkspace.backend.exception.OwnerRoleException;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.UserNotFoundException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProjectMemberServiceTest {

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PermissionService permissionService;

    @Mock
    private ProjectMemberMapper projectMemberMapper;

    @InjectMocks
    private ProjectMemberService projectMemberService;

    private static final String OWNER_EMAIL = "owner@example.com";
    private static final String MEMBER_EMAIL = "member@example.com";
    private static final String COLLAB_EMAIL = "collab@example.com";
    private User owner;
    private User collaborator;
    private UUID projectId;
    private UUID memberId;
    private Project project;
    private ProjectMember ownerMember;
    private ProjectMember collabMember;
    private ProjectMemberResponse collabResponse;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(UUID.randomUUID()).email(OWNER_EMAIL).username("owner").build();
        collaborator = User.builder().id(UUID.randomUUID()).email(COLLAB_EMAIL).username("collab").build();
        projectId = UUID.randomUUID();
        memberId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(owner).name("My Album").build();
        ownerMember = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(owner).role(ProjectRole.OWNER).build();
        collabMember = ProjectMember.builder().id(memberId).project(project).user(collaborator).role(ProjectRole.COLLABORATOR).build();
        collabResponse = new ProjectMemberResponse(memberId, new UserSummary(collaborator.getId(), "collab"),
                ProjectRole.COLLABORATOR, Instant.now());
    }

    @Test
    void addMember_savesAndReturnsMember() {
        CreateMemberRequest request = new CreateMemberRequest(COLLAB_EMAIL, ProjectRole.COLLABORATOR);

        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);
        when(userRepository.findByEmail(COLLAB_EMAIL)).thenReturn(Optional.of(collaborator));
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, collaborator.getId())).thenReturn(false);
        when(projectMemberRepository.saveAndFlush(any(ProjectMember.class))).thenReturn(collabMember);
        when(projectMemberMapper.toResponse(collabMember)).thenReturn(collabResponse);

        ProjectMemberResponse result = projectMemberService.addMember(projectId, request, OWNER_EMAIL);

        assertThat(result).isEqualTo(collabResponse);
        ArgumentCaptor<ProjectMember> captor = ArgumentCaptor.forClass(ProjectMember.class);
        verify(projectMemberRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(ProjectRole.COLLABORATOR);
        assertThat(captor.getValue().getUser()).isEqualTo(collaborator);
    }

    @Test
    void addMember_throwsWhenRoleIsOwner() {
        CreateMemberRequest request = new CreateMemberRequest(COLLAB_EMAIL, ProjectRole.OWNER);

        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);

        assertThatThrownBy(() -> projectMemberService.addMember(projectId, request, OWNER_EMAIL))
                .isInstanceOf(OwnerRoleException.class);

        verify(projectMemberRepository, never()).save(any());
    }

    @Test
    void addMember_throwsConflictWhenUserAlreadyMember() {
        CreateMemberRequest request = new CreateMemberRequest(COLLAB_EMAIL, ProjectRole.COLLABORATOR);

        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);
        when(userRepository.findByEmail(COLLAB_EMAIL)).thenReturn(Optional.of(collaborator));
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, collaborator.getId())).thenReturn(true);

        assertThatThrownBy(() -> projectMemberService.addMember(projectId, request, OWNER_EMAIL))
                .isInstanceOf(MemberAlreadyExistsException.class);
    }

    @Test
    void addMember_throwsWhenUserNotFound() {
        CreateMemberRequest request = new CreateMemberRequest("unknown@example.com", ProjectRole.COLLABORATOR);

        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectMemberService.addMember(projectId, request, OWNER_EMAIL))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void findAll_returnsAllMembersForProjectMember() {
        ProjectMember memberEntry = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(collaborator).role(ProjectRole.COLLABORATOR).build();

        when(permissionService.checkProjectPermission(projectId, MEMBER_EMAIL, ProjectRole.VIEWER)).thenReturn(project);
        when(projectMemberRepository.findByProjectId(projectId)).thenReturn(List.of(ownerMember, memberEntry, collabMember));
        when(projectMemberMapper.toResponse(ownerMember)).thenReturn(
                new ProjectMemberResponse(ownerMember.getId(), new UserSummary(owner.getId(), "owner"),
                        ProjectRole.OWNER, Instant.now()));
        when(projectMemberMapper.toResponse(memberEntry)).thenReturn(
                new ProjectMemberResponse(memberEntry.getId(), new UserSummary(collaborator.getId(), "collab"),
                        ProjectRole.COLLABORATOR, Instant.now()));
        when(projectMemberMapper.toResponse(collabMember)).thenReturn(collabResponse);

        List<ProjectMemberResponse> result = projectMemberService.findAll(projectId, MEMBER_EMAIL);

        assertThat(result).hasSize(3);
    }

    @Test
    void findAll_throwsWhenNotMember() {
        when(permissionService.checkProjectPermission(projectId, "stranger@example.com", ProjectRole.VIEWER))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> projectMemberService.findAll(projectId, "stranger@example.com"))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void updateRole_updatesCollaboratorRole() {
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.VIEWER);

        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, collaborator.getId())).thenReturn(Optional.of(collabMember));
        when(projectMemberRepository.save(collabMember)).thenReturn(collabMember);
        when(projectMemberMapper.toResponse(collabMember)).thenReturn(collabResponse);

        projectMemberService.updateRole(projectId, collaborator.getId(), request, OWNER_EMAIL);

        assertThat(collabMember.getRole()).isEqualTo(ProjectRole.VIEWER);
        verify(projectMemberRepository).save(collabMember);
    }

    @Test
    void updateRole_throwsWhenTargetRoleIsOwner() {
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.OWNER);

        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);

        assertThatThrownBy(() -> projectMemberService.updateRole(projectId, collaborator.getId(), request, OWNER_EMAIL))
                .isInstanceOf(OwnerRoleException.class);
    }

    @Test
    void updateRole_throwsWhenTargetIsOwner() {
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.VIEWER);

        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, owner.getId())).thenReturn(Optional.of(ownerMember));

        assertThatThrownBy(() -> projectMemberService.updateRole(projectId, owner.getId(), request, OWNER_EMAIL))
                .isInstanceOf(OwnerRoleException.class);
    }

    @Test
    void updateRole_throwsWhenMemberNotFound() {
        UUID fakeUserId = UUID.randomUUID();
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.VIEWER);

        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, fakeUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectMemberService.updateRole(projectId, fakeUserId, request, OWNER_EMAIL))
                .isInstanceOf(MemberNotFoundException.class);
    }

    @Test
    void removeMember_deletesCollaborator() {
        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, collaborator.getId())).thenReturn(Optional.of(collabMember));

        projectMemberService.removeMember(projectId, collaborator.getId(), OWNER_EMAIL);

        verify(projectMemberRepository).delete(collabMember);
    }

    @Test
    void removeMember_throwsWhenTargetIsOwner() {
        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, owner.getId())).thenReturn(Optional.of(ownerMember));

        assertThatThrownBy(() -> projectMemberService.removeMember(projectId, owner.getId(), OWNER_EMAIL))
                .isInstanceOf(OwnerRoleException.class);

        verify(projectMemberRepository, never()).delete(any());
    }

    @Test
    void removeMember_throwsWhenMemberNotFound() {
        UUID fakeUserId = UUID.randomUUID();

        when(permissionService.checkProjectPermission(projectId, OWNER_EMAIL, ProjectRole.OWNER)).thenReturn(project);
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, fakeUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectMemberService.removeMember(projectId, fakeUserId, OWNER_EMAIL))
                .isInstanceOf(MemberNotFoundException.class);
    }
}
