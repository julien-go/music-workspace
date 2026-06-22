package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.dto.AddMemberRequest;
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
    private ProjectAccessService projectAccessService;

    @Mock
    private ProjectMemberMapper projectMemberMapper;

    @InjectMocks
    private ProjectMemberService projectMemberService;

    private static final String OWNER_EMAIL = "owner@example.com";
    private static final String MEMBER_EMAIL = "member@example.com";
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
        collaborator = User.builder().id(UUID.randomUUID()).email("collab@example.com").username("collab").build();
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
        AddMemberRequest request = new AddMemberRequest(collaborator.getId(), ProjectRole.COLLABORATOR);

        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, collaborator.getId())).thenReturn(false);
        when(userRepository.findById(collaborator.getId())).thenReturn(Optional.of(collaborator));
        when(projectMemberRepository.save(any(ProjectMember.class))).thenReturn(collabMember);
        when(projectMemberMapper.toResponse(collabMember)).thenReturn(collabResponse);

        ProjectMemberResponse result = projectMemberService.addMember(projectId, request, OWNER_EMAIL);

        assertThat(result).isEqualTo(collabResponse);
        ArgumentCaptor<ProjectMember> captor = ArgumentCaptor.forClass(ProjectMember.class);
        verify(projectMemberRepository).save(captor.capture());
        assertThat(captor.getValue().getRole()).isEqualTo(ProjectRole.COLLABORATOR);
        assertThat(captor.getValue().getUser()).isEqualTo(collaborator);
    }

    @Test
    void addMember_throwsWhenRoleIsOwner() {
        AddMemberRequest request = new AddMemberRequest(collaborator.getId(), ProjectRole.OWNER);

        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);

        assertThatThrownBy(() -> projectMemberService.addMember(projectId, request, OWNER_EMAIL))
                .isInstanceOf(OwnerRoleException.class);

        verify(projectMemberRepository, never()).save(any());
    }

    @Test
    void addMember_throwsWhenUserAlreadyMember() {
        AddMemberRequest request = new AddMemberRequest(collaborator.getId(), ProjectRole.COLLABORATOR);

        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, collaborator.getId())).thenReturn(true);

        assertThatThrownBy(() -> projectMemberService.addMember(projectId, request, OWNER_EMAIL))
                .isInstanceOf(MemberAlreadyExistsException.class);
    }

    @Test
    void addMember_throwsWhenUserNotFound() {
        UUID fakeUserId = UUID.randomUUID();
        AddMemberRequest request = new AddMemberRequest(fakeUserId, ProjectRole.COLLABORATOR);

        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, fakeUserId)).thenReturn(false);
        when(userRepository.findById(fakeUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectMemberService.addMember(projectId, request, OWNER_EMAIL))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void findAll_returnsAllMembersForProjectMember() {
        User member = User.builder().id(UUID.randomUUID()).email(MEMBER_EMAIL).username("member").build();

        when(projectAccessService.resolveUser(MEMBER_EMAIL)).thenReturn(member);
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, member.getId())).thenReturn(true);
        when(projectMemberRepository.findByProjectId(projectId)).thenReturn(List.of(ownerMember, collabMember));
        when(projectMemberMapper.toResponse(ownerMember)).thenReturn(
                new ProjectMemberResponse(ownerMember.getId(), new UserSummary(owner.getId(), "owner"),
                        ProjectRole.OWNER, Instant.now()));
        when(projectMemberMapper.toResponse(collabMember)).thenReturn(collabResponse);

        List<ProjectMemberResponse> result = projectMemberService.findAll(projectId, MEMBER_EMAIL);

        assertThat(result).hasSize(2);
    }

    @Test
    void findAll_throwsWhenNotMember() {
        User stranger = User.builder().id(UUID.randomUUID()).email("stranger@example.com").username("stranger").build();

        when(projectAccessService.resolveUser("stranger@example.com")).thenReturn(stranger);
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, stranger.getId())).thenReturn(false);

        assertThatThrownBy(() -> projectMemberService.findAll(projectId, "stranger@example.com"))
                .isInstanceOf(MemberNotFoundException.class);
    }

    @Test
    void updateRole_updatesCollaboratorRole() {
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.VIEWER);

        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectMemberRepository.findByIdAndProjectId(memberId, projectId)).thenReturn(Optional.of(collabMember));
        when(projectMemberMapper.toResponse(collabMember)).thenReturn(collabResponse);

        projectMemberService.updateRole(projectId, memberId, request, OWNER_EMAIL);

        assertThat(collabMember.getRole()).isEqualTo(ProjectRole.VIEWER);
    }

    @Test
    void updateRole_throwsWhenTargetRoleIsOwner() {
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.OWNER);

        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);

        assertThatThrownBy(() -> projectMemberService.updateRole(projectId, memberId, request, OWNER_EMAIL))
                .isInstanceOf(OwnerRoleException.class);
    }

    @Test
    void updateRole_throwsWhenTargetIsOwner() {
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.VIEWER);

        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectMemberRepository.findByIdAndProjectId(ownerMember.getId(), projectId)).thenReturn(Optional.of(ownerMember));

        assertThatThrownBy(() -> projectMemberService.updateRole(projectId, ownerMember.getId(), request, OWNER_EMAIL))
                .isInstanceOf(OwnerRoleException.class);
    }

    @Test
    void updateRole_throwsWhenMemberNotFound() {
        UUID fakeMemberId = UUID.randomUUID();
        UpdateMemberRoleRequest request = new UpdateMemberRoleRequest(ProjectRole.VIEWER);

        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectMemberRepository.findByIdAndProjectId(fakeMemberId, projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectMemberService.updateRole(projectId, fakeMemberId, request, OWNER_EMAIL))
                .isInstanceOf(MemberNotFoundException.class);
    }

    @Test
    void removeMember_deletesCollaborator() {
        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectMemberRepository.findByIdAndProjectId(memberId, projectId)).thenReturn(Optional.of(collabMember));

        projectMemberService.removeMember(projectId, memberId, OWNER_EMAIL);

        verify(projectMemberRepository).delete(collabMember);
    }

    @Test
    void removeMember_throwsWhenTargetIsOwner() {
        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectMemberRepository.findByIdAndProjectId(ownerMember.getId(), projectId)).thenReturn(Optional.of(ownerMember));

        assertThatThrownBy(() -> projectMemberService.removeMember(projectId, ownerMember.getId(), OWNER_EMAIL))
                .isInstanceOf(OwnerRoleException.class);

        verify(projectMemberRepository, never()).delete(any());
    }

    @Test
    void removeMember_throwsWhenMemberNotFound() {
        UUID fakeMemberId = UUID.randomUUID();

        when(projectAccessService.resolveUser(OWNER_EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectMemberRepository.findByIdAndProjectId(fakeMemberId, projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectMemberService.removeMember(projectId, fakeMemberId, OWNER_EMAIL))
                .isInstanceOf(MemberNotFoundException.class);
    }
}
