package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CommentMapper;
import com.musicworkspace.backend.dto.CommentResponse;
import com.musicworkspace.backend.dto.CreateCommentRequest;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.TrackVersion;
import com.musicworkspace.backend.entity.TrackVersionComment;
import com.musicworkspace.backend.exception.CommentNotFoundException;
import com.musicworkspace.backend.repository.TrackVersionCommentRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrackVersionCommentService {

    private final TrackVersionCommentRepository trackVersionCommentRepository;
    private final CommentMapper commentMapper;
    private final PermissionService permissionService;

    @Transactional
    public CommentResponse create(UUID projectId, UUID trackId, UUID versionId, CreateCommentRequest request, String email) {
        TrackVersion version = permissionService.checkTrackVersionPermission(projectId, trackId, versionId, email, ProjectRole.VIEWER);

        TrackVersionComment comment = TrackVersionComment.builder()
                .trackVersion(version)
                .author(permissionService.resolveUser(email))
                .content(request.content())
                .build();

        return commentMapper.toResponse(trackVersionCommentRepository.saveAndFlush(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> findAll(UUID projectId, UUID trackId, UUID versionId, String email) {
        permissionService.checkTrackVersionPermission(projectId, trackId, versionId, email, ProjectRole.VIEWER);
        return trackVersionCommentRepository.findByTrackVersionIdOrderByCreatedAtAsc(versionId).stream()
                .map(commentMapper::toResponse)
                .toList();
    }

    @Transactional
    public void delete(UUID projectId, UUID trackId, UUID versionId, UUID commentId, String email) {
        ProjectMember member = permissionService.resolveMembership(projectId, email, ProjectRole.VIEWER);
        permissionService.checkTrackVersionPermission(projectId, trackId, versionId, email, ProjectRole.VIEWER);
        TrackVersionComment comment = trackVersionCommentRepository.findByIdAndTrackVersionId(commentId, versionId)
                .orElseThrow(() -> new CommentNotFoundException("Comment not found"));
        permissionService.checkCommentDeletePermission(member.getRole(), member.getUser().getId(), comment.getAuthor().getId());
        trackVersionCommentRepository.delete(comment);
    }
}
