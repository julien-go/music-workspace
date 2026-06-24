package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CommentMapper;
import com.musicworkspace.backend.dto.CommentResponse;
import com.musicworkspace.backend.dto.CreateCommentRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectComment;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.exception.CommentNotFoundException;
import com.musicworkspace.backend.repository.ProjectCommentRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectCommentService {

    private final ProjectCommentRepository projectCommentRepository;
    private final CommentMapper commentMapper;
    private final PermissionService permissionService;

    @Transactional
    public CommentResponse create(UUID projectId, CreateCommentRequest request, String email) {
        ProjectMember member = permissionService.resolveMembership(projectId, email, ProjectRole.VIEWER);

        ProjectComment comment = ProjectComment.builder()
                .project(member.getProject())
                .author(member.getUser())
                .content(request.content())
                .build();

        return commentMapper.toResponse(projectCommentRepository.saveAndFlush(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> findAll(UUID projectId, String email) {
        permissionService.checkProjectPermission(projectId, email, ProjectRole.VIEWER);
        return projectCommentRepository.findByProjectIdOrderByCreatedAtAsc(projectId).stream()
                .map(commentMapper::toResponse)
                .toList();
    }

    @Transactional
    public void delete(UUID projectId, UUID commentId, String email) {
        ProjectMember member = permissionService.resolveMembership(projectId, email, ProjectRole.VIEWER);
        ProjectComment comment = projectCommentRepository.findByIdAndProjectId(commentId, projectId)
                .orElseThrow(() -> new CommentNotFoundException("Comment not found"));
        permissionService.checkCommentDeletePermission(member.getRole(), member.getUser().getId(), comment.getAuthor().getId());
        projectCommentRepository.delete(comment);
    }
}
