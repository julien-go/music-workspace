package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.entity.TrackVersion;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.CommentNotFoundException;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.TaskNotFoundException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.exception.TrackVersionNotFoundException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.musicworkspace.backend.repository.TrackRepository;
import com.musicworkspace.backend.repository.TrackVersionRepository;
import com.musicworkspace.backend.repository.UserRepository;
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
    private TrackVersionRepository trackVersionRepository;

    @Mock
    private UserRepository userRepository;

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
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId()))
                .thenReturn(Optional.of(memberWithRole(role)));
    }

    private void stubResolveAndNoMember() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
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
    void checkTrackVersionPermission_validMemberAndVersionExists_succeeds() {
        stubResolveAndMember(ProjectRole.COLLABORATOR);
        UUID trackId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        Track track = Track.builder().id(trackId).project(project).name("Intro").status(TrackStatus.DRAFT).build();
        TrackVersion version = TrackVersion.builder().id(versionId).track(track).versionNumber(1).audioUrl("https://cdn.example.com/v1.mp3").build();
        when(trackRepository.findByIdAndProjectId(trackId, projectId)).thenReturn(Optional.of(track));
        when(trackVersionRepository.findByIdAndTrackId(versionId, trackId)).thenReturn(Optional.of(version));

        TrackVersion result = permissionService.checkTrackVersionPermission(projectId, trackId, versionId, EMAIL, ProjectRole.COLLABORATOR);

        assertThat(result.getId()).isEqualTo(versionId);
    }

    @Test
    void checkTrackVersionPermission_versionNotFound_throws() {
        stubResolveAndMember(ProjectRole.COLLABORATOR);
        UUID trackId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();
        Track track = Track.builder().id(trackId).project(project).name("Intro").status(TrackStatus.DRAFT).build();
        when(trackRepository.findByIdAndProjectId(trackId, projectId)).thenReturn(Optional.of(track));
        when(trackVersionRepository.findByIdAndTrackId(versionId, trackId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> permissionService.checkTrackVersionPermission(projectId, trackId, versionId, EMAIL, ProjectRole.COLLABORATOR))
                .isInstanceOf(TrackVersionNotFoundException.class);
    }

    @Test
    void checkTaskDeletePermission_ownerDeletingAnotherUsersTask_succeeds() {
        UUID otherUserId = UUID.randomUUID();

        assertThatCode(() -> permissionService.checkTaskDeletePermission(ProjectRole.OWNER, user.getId(), otherUserId))
                .doesNotThrowAnyException();
    }

    @Test
    void checkTaskDeletePermission_collaboratorDeletingOwnTask_succeeds() {
        assertThatCode(() -> permissionService.checkTaskDeletePermission(ProjectRole.COLLABORATOR, user.getId(), user.getId()))
                .doesNotThrowAnyException();
    }

    @Test
    void checkTaskDeletePermission_collaboratorDeletingAnothersTask_throws() {
        UUID otherUserId = UUID.randomUUID();

        assertThatThrownBy(() -> permissionService.checkTaskDeletePermission(ProjectRole.COLLABORATOR, user.getId(), otherUserId))
                .isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void resolveMembership_validMember_returnsMember() {
        stubResolveAndMember(ProjectRole.COLLABORATOR);

        ProjectMember result = permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER);

        assertThat(result.getRole()).isEqualTo(ProjectRole.COLLABORATOR);
        assertThat(result.getProject().getId()).isEqualTo(projectId);
    }

    @Test
    void resolveMembership_insufficientRole_throws() {
        stubResolveAndMember(ProjectRole.VIEWER);

        assertThatThrownBy(() -> permissionService.resolveMembership(projectId, EMAIL, ProjectRole.COLLABORATOR))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void resolveMembership_nonMember_throws() {
        stubResolveAndNoMember();

        assertThatThrownBy(() -> permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void checkCommentDeletePermission_ownerDeletingAnotherUsersComment_succeeds() {
        UUID otherUserId = UUID.randomUUID();

        assertThatCode(() -> permissionService.checkCommentDeletePermission(ProjectRole.OWNER, user.getId(), otherUserId))
                .doesNotThrowAnyException();
    }

    @Test
    void checkCommentDeletePermission_authorDeletingOwnComment_succeeds() {
        assertThatCode(() -> permissionService.checkCommentDeletePermission(ProjectRole.COLLABORATOR, user.getId(), user.getId()))
                .doesNotThrowAnyException();
    }

    @Test
    void checkCommentDeletePermission_collaboratorDeletingAnothersComment_throws() {
        UUID otherUserId = UUID.randomUUID();

        assertThatThrownBy(() -> permissionService.checkCommentDeletePermission(ProjectRole.COLLABORATOR, user.getId(), otherUserId))
                .isInstanceOf(CommentNotFoundException.class);
    }

    @Test
    void resolveUser_returnsUserForEmail() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        User result = permissionService.resolveUser(EMAIL);

        assertThat(result).isEqualTo(user);
    }

    @Test
    void resolveUser_throwsWhenUserNotFound() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> permissionService.resolveUser(EMAIL))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
