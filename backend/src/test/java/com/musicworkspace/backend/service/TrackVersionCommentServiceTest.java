package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.dto.CommentMapper;
import com.musicworkspace.backend.dto.CommentResponse;
import com.musicworkspace.backend.dto.CreateCommentRequest;
import com.musicworkspace.backend.dto.UserSummary;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.entity.TrackVersion;
import com.musicworkspace.backend.entity.TrackVersionComment;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.CommentNotFoundException;
import com.musicworkspace.backend.exception.TrackVersionNotFoundException;
import com.musicworkspace.backend.repository.TrackVersionCommentRepository;
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
class TrackVersionCommentServiceTest {

    @Mock
    private TrackVersionCommentRepository trackVersionCommentRepository;

    @Mock
    private CommentMapper commentMapper;

    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private TrackVersionCommentService trackVersionCommentService;

    private static final String EMAIL = "test@example.com";
    private User author;
    private UUID projectId;
    private UUID trackId;
    private UUID versionId;
    private Project project;
    private Track track;
    private TrackVersion version;
    private TrackVersionComment comment;
    private CommentResponse response;

    @BeforeEach
    void setUp() {
        author = User.builder().id(UUID.randomUUID()).email(EMAIL).username("testuser").build();
        projectId = UUID.randomUUID();
        trackId = UUID.randomUUID();
        versionId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(author).name("My Album").build();
        track = Track.builder().id(trackId).project(project).name("Intro").status(TrackStatus.DRAFT).build();
        version = TrackVersion.builder().id(versionId).track(track).versionNumber(1).audioUrl("https://cdn.example.com/v1.mp3").build();
        comment = TrackVersionComment.builder().id(UUID.randomUUID()).trackVersion(version).author(author).content("Tempo is off").build();
        response = new CommentResponse(comment.getId(), "Tempo is off", new UserSummary(author.getId(), "testuser"), Instant.now());
    }

    @Test
    void create_savesAndReturnsComment() {
        CreateCommentRequest request = new CreateCommentRequest("Tempo is off");

        when(permissionService.checkTrackVersionPermission(projectId, trackId, versionId, EMAIL, ProjectRole.VIEWER)).thenReturn(version);
        when(permissionService.resolveUser(EMAIL)).thenReturn(author);
        when(trackVersionCommentRepository.saveAndFlush(any(TrackVersionComment.class))).thenReturn(comment);
        when(commentMapper.toResponse(comment)).thenReturn(response);

        CommentResponse result = trackVersionCommentService.create(projectId, trackId, versionId, request, EMAIL);

        assertThat(result).isEqualTo(response);
        ArgumentCaptor<TrackVersionComment> captor = ArgumentCaptor.forClass(TrackVersionComment.class);
        verify(trackVersionCommentRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getContent()).isEqualTo("Tempo is off");
        assertThat(captor.getValue().getTrackVersion()).isEqualTo(version);
    }

    @Test
    void create_throwsWhenVersionNotFound() {
        CreateCommentRequest request = new CreateCommentRequest("Tempo is off");

        when(permissionService.checkTrackVersionPermission(projectId, trackId, versionId, EMAIL, ProjectRole.VIEWER))
                .thenThrow(new TrackVersionNotFoundException("Track version not found"));

        assertThatThrownBy(() -> trackVersionCommentService.create(projectId, trackId, versionId, request, EMAIL))
                .isInstanceOf(TrackVersionNotFoundException.class);
    }

    @Test
    void findAll_returnsCommentsForVersion() {
        when(permissionService.checkTrackVersionPermission(projectId, trackId, versionId, EMAIL, ProjectRole.VIEWER)).thenReturn(version);
        when(trackVersionCommentRepository.findByTrackVersionIdOrderByCreatedAtAsc(versionId)).thenReturn(List.of(comment));
        when(commentMapper.toResponse(comment)).thenReturn(response);

        List<CommentResponse> result = trackVersionCommentService.findAll(projectId, trackId, versionId, EMAIL);

        assertThat(result).containsExactly(response);
    }

    @Test
    void delete_removesOwnComment() {
        ProjectMember member = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();
        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(member);
        when(permissionService.checkTrackVersionPermission(projectId, trackId, versionId, EMAIL, ProjectRole.VIEWER)).thenReturn(version);
        when(trackVersionCommentRepository.findByIdAndTrackVersionId(comment.getId(), versionId)).thenReturn(Optional.of(comment));

        trackVersionCommentService.delete(projectId, trackId, versionId, comment.getId(), EMAIL);

        verify(trackVersionCommentRepository).delete(comment);
    }

    @Test
    void delete_ownerCanDeleteAnyComment() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@test.com").username("other").build();
        TrackVersionComment otherComment = TrackVersionComment.builder().id(UUID.randomUUID()).trackVersion(version).author(otherUser).content("Needs work").build();
        ProjectMember ownerMember = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.OWNER).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(ownerMember);
        when(permissionService.checkTrackVersionPermission(projectId, trackId, versionId, EMAIL, ProjectRole.VIEWER)).thenReturn(version);
        when(trackVersionCommentRepository.findByIdAndTrackVersionId(otherComment.getId(), versionId)).thenReturn(Optional.of(otherComment));

        trackVersionCommentService.delete(projectId, trackId, versionId, otherComment.getId(), EMAIL);

        verify(trackVersionCommentRepository).delete(otherComment);
    }

    @Test
    void delete_collaboratorCannotDeleteOthersComment() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@test.com").username("other").build();
        TrackVersionComment otherComment = TrackVersionComment.builder().id(UUID.randomUUID()).trackVersion(version).author(otherUser).content("Needs work").build();
        ProjectMember collabMember = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(collabMember);
        when(permissionService.checkTrackVersionPermission(projectId, trackId, versionId, EMAIL, ProjectRole.VIEWER)).thenReturn(version);
        when(trackVersionCommentRepository.findByIdAndTrackVersionId(otherComment.getId(), versionId)).thenReturn(Optional.of(otherComment));
        doThrow(new CommentNotFoundException("Comment not found"))
                .when(permissionService).checkCommentDeletePermission(ProjectRole.COLLABORATOR, author.getId(), otherUser.getId());

        assertThatThrownBy(() -> trackVersionCommentService.delete(projectId, trackId, versionId, otherComment.getId(), EMAIL))
                .isInstanceOf(CommentNotFoundException.class);

        verify(trackVersionCommentRepository, never()).delete(any());
    }

    @Test
    void delete_throwsWhenCommentNotFound() {
        UUID fakeCommentId = UUID.randomUUID();
        ProjectMember member = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(member);
        when(permissionService.checkTrackVersionPermission(projectId, trackId, versionId, EMAIL, ProjectRole.VIEWER)).thenReturn(version);
        when(trackVersionCommentRepository.findByIdAndTrackVersionId(fakeCommentId, versionId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> trackVersionCommentService.delete(projectId, trackId, versionId, fakeCommentId, EMAIL))
                .isInstanceOf(CommentNotFoundException.class);
    }
}
