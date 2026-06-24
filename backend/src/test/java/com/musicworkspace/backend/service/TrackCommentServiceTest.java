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
import com.musicworkspace.backend.entity.TrackComment;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.CommentNotFoundException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.repository.TrackCommentRepository;
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
class TrackCommentServiceTest {

    @Mock
    private TrackCommentRepository trackCommentRepository;

    @Mock
    private CommentMapper commentMapper;

    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private TrackCommentService trackCommentService;

    private static final String EMAIL = "test@example.com";
    private User author;
    private UUID projectId;
    private UUID trackId;
    private Project project;
    private Track track;
    private TrackComment comment;
    private CommentResponse response;

    @BeforeEach
    void setUp() {
        author = User.builder().id(UUID.randomUUID()).email(EMAIL).username("testuser").build();
        projectId = UUID.randomUUID();
        trackId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(author).name("My Album").build();
        track = Track.builder().id(trackId).project(project).name("Intro").status(TrackStatus.DRAFT).build();
        comment = TrackComment.builder().id(UUID.randomUUID()).track(track).author(author).content("Sounds great").build();
        response = new CommentResponse(comment.getId(), "Sounds great", new UserSummary(author.getId(), "testuser"), Instant.now());
    }

    @Test
    void create_savesAndReturnsComment() {
        CreateCommentRequest request = new CreateCommentRequest("Sounds great");

        ProjectMember member = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();
        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(member);
        when(permissionService.resolveTrack(projectId, trackId)).thenReturn(track);
        when(trackCommentRepository.saveAndFlush(any(TrackComment.class))).thenReturn(comment);
        when(commentMapper.toResponse(comment)).thenReturn(response);

        CommentResponse result = trackCommentService.create(projectId, trackId, request, EMAIL);

        assertThat(result).isEqualTo(response);
        ArgumentCaptor<TrackComment> captor = ArgumentCaptor.forClass(TrackComment.class);
        verify(trackCommentRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getContent()).isEqualTo("Sounds great");
        assertThat(captor.getValue().getTrack()).isEqualTo(track);
    }

    @Test
    void create_throwsWhenTrackNotFound() {
        CreateCommentRequest request = new CreateCommentRequest("Sounds great");

        ProjectMember member = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();
        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(member);
        when(permissionService.resolveTrack(projectId, trackId))
                .thenThrow(new TrackNotFoundException("Track not found"));

        assertThatThrownBy(() -> trackCommentService.create(projectId, trackId, request, EMAIL))
                .isInstanceOf(TrackNotFoundException.class);
    }

    @Test
    void findAll_returnsCommentsForTrack() {
        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.VIEWER)).thenReturn(track);
        when(trackCommentRepository.findByTrackIdOrderByCreatedAtAsc(trackId)).thenReturn(List.of(comment));
        when(commentMapper.toResponse(comment)).thenReturn(response);

        List<CommentResponse> result = trackCommentService.findAll(projectId, trackId, EMAIL);

        assertThat(result).containsExactly(response);
    }

    @Test
    void delete_removesOwnComment() {
        ProjectMember member = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();
        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(member);
        when(permissionService.resolveTrack(projectId, trackId)).thenReturn(track);
        when(trackCommentRepository.findByIdAndTrackId(comment.getId(), trackId)).thenReturn(Optional.of(comment));

        trackCommentService.delete(projectId, trackId, comment.getId(), EMAIL);

        verify(trackCommentRepository).delete(comment);
    }

    @Test
    void delete_ownerCanDeleteAnyComment() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@test.com").username("other").build();
        TrackComment otherComment = TrackComment.builder().id(UUID.randomUUID()).track(track).author(otherUser).content("Needs work").build();
        ProjectMember ownerMember = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.OWNER).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(ownerMember);
        when(permissionService.resolveTrack(projectId, trackId)).thenReturn(track);
        when(trackCommentRepository.findByIdAndTrackId(otherComment.getId(), trackId)).thenReturn(Optional.of(otherComment));

        trackCommentService.delete(projectId, trackId, otherComment.getId(), EMAIL);

        verify(trackCommentRepository).delete(otherComment);
    }

    @Test
    void delete_collaboratorCannotDeleteOthersComment() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@test.com").username("other").build();
        TrackComment otherComment = TrackComment.builder().id(UUID.randomUUID()).track(track).author(otherUser).content("Needs work").build();
        ProjectMember collabMember = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(collabMember);
        when(permissionService.resolveTrack(projectId, trackId)).thenReturn(track);
        when(trackCommentRepository.findByIdAndTrackId(otherComment.getId(), trackId)).thenReturn(Optional.of(otherComment));
        doThrow(new CommentNotFoundException("Comment not found"))
                .when(permissionService).checkCommentDeletePermission(ProjectRole.COLLABORATOR, author.getId(), otherUser.getId());

        assertThatThrownBy(() -> trackCommentService.delete(projectId, trackId, otherComment.getId(), EMAIL))
                .isInstanceOf(CommentNotFoundException.class);

        verify(trackCommentRepository, never()).delete(any());
    }

    @Test
    void delete_throwsWhenCommentNotFound() {
        UUID fakeCommentId = UUID.randomUUID();
        ProjectMember member = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(member);
        when(permissionService.resolveTrack(projectId, trackId)).thenReturn(track);
        when(trackCommentRepository.findByIdAndTrackId(fakeCommentId, trackId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> trackCommentService.delete(projectId, trackId, fakeCommentId, EMAIL))
                .isInstanceOf(CommentNotFoundException.class);
    }
}
