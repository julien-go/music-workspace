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
import com.musicworkspace.backend.entity.ProjectComment;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.CommentNotFoundException;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.repository.ProjectCommentRepository;
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
class ProjectCommentServiceTest {

    @Mock
    private ProjectCommentRepository projectCommentRepository;

    @Mock
    private CommentMapper commentMapper;

    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private ProjectCommentService projectCommentService;

    private static final String EMAIL = "test@example.com";
    private User author;
    private UUID projectId;
    private Project project;
    private ProjectComment comment;
    private CommentResponse response;

    @BeforeEach
    void setUp() {
        author = User.builder().id(UUID.randomUUID()).email(EMAIL).username("testuser").build();
        projectId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(author).name("My Album").build();
        comment = ProjectComment.builder().id(UUID.randomUUID()).project(project).author(author).content("Great mix!").build();
        response = new CommentResponse(comment.getId(), "Great mix!", new UserSummary(author.getId(), "testuser"), Instant.now());
    }

    @Test
    void create_savesAndReturnsComment() {
        CreateCommentRequest request = new CreateCommentRequest("Great mix!");

        ProjectMember member = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();
        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(member);
        when(projectCommentRepository.saveAndFlush(any(ProjectComment.class))).thenReturn(comment);
        when(commentMapper.toResponse(comment)).thenReturn(response);

        CommentResponse result = projectCommentService.create(projectId, request, EMAIL);

        assertThat(result).isEqualTo(response);
        ArgumentCaptor<ProjectComment> captor = ArgumentCaptor.forClass(ProjectComment.class);
        verify(projectCommentRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getContent()).isEqualTo("Great mix!");
        assertThat(captor.getValue().getAuthor()).isEqualTo(author);
        assertThat(captor.getValue().getProject()).isEqualTo(project);
    }

    @Test
    void create_throwsWhenNotMember() {
        CreateCommentRequest request = new CreateCommentRequest("Great mix!");

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> projectCommentService.create(projectId, request, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void findAll_returnsCommentsForProject() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(project);
        when(projectCommentRepository.findByProjectIdOrderByCreatedAtAsc(projectId)).thenReturn(List.of(comment));
        when(commentMapper.toResponse(comment)).thenReturn(response);

        List<CommentResponse> result = projectCommentService.findAll(projectId, EMAIL);

        assertThat(result).containsExactly(response);
    }

    @Test
    void findAll_throwsWhenNotMember() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> projectCommentService.findAll(projectId, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void delete_removesOwnComment() {
        ProjectMember member = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();
        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(member);
        when(projectCommentRepository.findByIdAndProjectId(comment.getId(), projectId)).thenReturn(Optional.of(comment));

        projectCommentService.delete(projectId, comment.getId(), EMAIL);

        verify(projectCommentRepository).delete(comment);
    }

    @Test
    void delete_ownerCanDeleteAnyComment() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@test.com").username("other").build();
        ProjectComment otherComment = ProjectComment.builder().id(UUID.randomUUID()).project(project).author(otherUser).content("Needs work").build();
        ProjectMember ownerMember = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.OWNER).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(ownerMember);
        when(projectCommentRepository.findByIdAndProjectId(otherComment.getId(), projectId)).thenReturn(Optional.of(otherComment));

        projectCommentService.delete(projectId, otherComment.getId(), EMAIL);

        verify(projectCommentRepository).delete(otherComment);
    }

    @Test
    void delete_collaboratorCannotDeleteOthersComment() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@test.com").username("other").build();
        ProjectComment otherComment = ProjectComment.builder().id(UUID.randomUUID()).project(project).author(otherUser).content("Needs work").build();
        ProjectMember collabMember = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(collabMember);
        when(projectCommentRepository.findByIdAndProjectId(otherComment.getId(), projectId)).thenReturn(Optional.of(otherComment));
        doThrow(new CommentNotFoundException("Comment not found"))
                .when(permissionService).checkCommentDeletePermission(ProjectRole.COLLABORATOR, author.getId(), otherUser.getId());

        assertThatThrownBy(() -> projectCommentService.delete(projectId, otherComment.getId(), EMAIL))
                .isInstanceOf(CommentNotFoundException.class);

        verify(projectCommentRepository, never()).delete(any());
    }

    @Test
    void delete_throwsWhenCommentNotFound() {
        UUID fakeCommentId = UUID.randomUUID();
        ProjectMember member = ProjectMember.builder().id(UUID.randomUUID()).project(project).user(author).role(ProjectRole.COLLABORATOR).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(member);
        when(projectCommentRepository.findByIdAndProjectId(fakeCommentId, projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectCommentService.delete(projectId, fakeCommentId, EMAIL))
                .isInstanceOf(CommentNotFoundException.class);
    }
}
