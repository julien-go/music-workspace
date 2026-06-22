package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.TaskNotFoundException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.TrackRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private TrackRepository trackRepository;

    @Mock
    private ProjectAccessService projectAccessService;

    @InjectMocks
    private PermissionService permissionService;

    private static final String EMAIL = "user@example.com";
    private User user;
    private UUID projectId;
    private Project project;

    @BeforeEach
    void setUp() {
        user = User.builder().id(UUID.randomUUID()).email(EMAIL).username("testuser").build();
        projectId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(user).name("My Album").build();
    }

    private ProjectMember memberWithRole(ProjectRole role) {
        return ProjectMember.builder()
                .id(UUID.randomUUID())
                .project(project)
                .user(user)
                .role(role)
                .build();
    }

    private void stubResolveAndMember(ProjectRole role) {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(user);
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId()))
                .thenReturn(Optional.of(memberWithRole(role)));
    }

    private void stubResolveAndNoMember() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(user);
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId()))
                .thenReturn(Optional.empty());
    }

    @Test
    void checkProjectPermission_ownerWithViewerRequired_succeeds() {
        stubResolveAndMember(ProjectRole.OWNER);

        Project result = permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER);

        assertThat(result.getId()).isEqualTo(projectId);
    }

    @Test
    void checkProjectPermission_collaboratorWithViewerRequired_succeeds() {
        stubResolveAndMember(ProjectRole.COLLABORATOR);

        Project result = permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER);

        assertThat(result.getId()).isEqualTo(projectId);
    }

    @Test
    void checkProjectPermission_viewerWithViewerRequired_succeeds() {
        stubResolveAndMember(ProjectRole.VIEWER);

        Project result = permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER);

        assertThat(result.getId()).isEqualTo(projectId);
    }

    @Test
    void checkProjectPermission_viewerWithCollaboratorRequired_throws() {
        stubResolveAndMember(ProjectRole.VIEWER);

        assertThatThrownBy(() -> permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void checkProjectPermission_viewerWithOwnerRequired_throws() {
        stubResolveAndMember(ProjectRole.VIEWER);

        assertThatThrownBy(() -> permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.OWNER))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void checkProjectPermission_collaboratorWithOwnerRequired_throws() {
        stubResolveAndMember(ProjectRole.COLLABORATOR);

        assertThatThrownBy(() -> permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.OWNER))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void checkProjectPermission_nonMember_throws() {
        stubResolveAndNoMember();

        assertThatThrownBy(() -> permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void checkTrackPermission_validMemberAndTrackExists_succeeds() {
        stubResolveAndMember(ProjectRole.COLLABORATOR);
        UUID trackId = UUID.randomUUID();
        Track track = Track.builder().id(trackId).project(project).name("Intro").status(TrackStatus.DRAFT).build();
        when(trackRepository.findByIdAndProjectId(trackId, projectId)).thenReturn(Optional.of(track));

        Track result = permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.COLLABORATOR);

        assertThat(result.getId()).isEqualTo(trackId);
    }

    @Test
    void checkTrackPermission_validMemberAndTrackNotFound_throws() {
        stubResolveAndMember(ProjectRole.COLLABORATOR);
        UUID trackId = UUID.randomUUID();
        when(trackRepository.findByIdAndProjectId(trackId, projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.COLLABORATOR))
                .isInstanceOf(TrackNotFoundException.class);
    }

    @Test
    void checkTrackPermission_nonMember_throwsProjectNotFound() {
        stubResolveAndNoMember();
        UUID trackId = UUID.randomUUID();

        assertThatThrownBy(() -> permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.VIEWER))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void checkTaskDeletePermission_ownerDeletingAnotherUsersTask_succeeds() {
        stubResolveAndMember(ProjectRole.OWNER);
        UUID otherUserId = UUID.randomUUID();

        assertThatCode(() -> permissionService.checkTaskDeletePermission(projectId, otherUserId, EMAIL))
                .doesNotThrowAnyException();
    }

    @Test
    void checkTaskDeletePermission_collaboratorDeletingOwnTask_succeeds() {
        stubResolveAndMember(ProjectRole.COLLABORATOR);

        assertThatCode(() -> permissionService.checkTaskDeletePermission(projectId, user.getId(), EMAIL))
                .doesNotThrowAnyException();
    }

    @Test
    void checkTaskDeletePermission_collaboratorDeletingAnothersTask_throws() {
        stubResolveAndMember(ProjectRole.COLLABORATOR);
        UUID otherUserId = UUID.randomUUID();

        assertThatThrownBy(() -> permissionService.checkTaskDeletePermission(projectId, otherUserId, EMAIL))
                .isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void checkTaskDeletePermission_viewer_throwsProjectNotFound() {
        stubResolveAndMember(ProjectRole.VIEWER);

        assertThatThrownBy(() -> permissionService.checkTaskDeletePermission(projectId, user.getId(), EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void checkTaskDeletePermission_nonMember_throwsProjectNotFound() {
        stubResolveAndNoMember();

        assertThatThrownBy(() -> permissionService.checkTaskDeletePermission(projectId, user.getId(), EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void resolveUser_delegatesToProjectAccessService() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(user);

        User result = permissionService.resolveUser(EMAIL);

        assertThat(result).isEqualTo(user);
        verify(projectAccessService).resolveUser(EMAIL);
    }
}
