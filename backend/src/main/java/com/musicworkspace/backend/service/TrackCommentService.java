package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CommentMapper;
import com.musicworkspace.backend.dto.CommentResponse;
import com.musicworkspace.backend.dto.CreateCommentRequest;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackComment;
import com.musicworkspace.backend.exception.CommentNotFoundException;
import com.musicworkspace.backend.repository.TrackCommentRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrackCommentService {

    private final TrackCommentRepository trackCommentRepository;
    private final CommentMapper commentMapper;
    private final PermissionService permissionService;

    @Transactional
    public CommentResponse create(UUID projectId, UUID trackId, CreateCommentRequest request, String email) {
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.VIEWER);

        TrackComment comment = TrackComment.builder()
                .track(track)
                .author(permissionService.resolveUser(email))
                .content(request.content())
                .build();

        return commentMapper.toResponse(trackCommentRepository.saveAndFlush(comment));
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> findAll(UUID projectId, UUID trackId, String email) {
        permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.VIEWER);
        return trackCommentRepository.findByTrackIdOrderByCreatedAtAsc(trackId).stream()
                .map(commentMapper::toResponse)
                .toList();
    }

    @Transactional
    public void delete(UUID projectId, UUID trackId, UUID commentId, String email) {
        ProjectMember member = permissionService.resolveMembership(projectId, email, ProjectRole.VIEWER);
        permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.VIEWER);
        TrackComment comment = trackCommentRepository.findByIdAndTrackId(commentId, trackId)
                .orElseThrow(() -> new CommentNotFoundException("Comment not found"));
        permissionService.checkCommentDeletePermission(member.getRole(), member.getUser().getId(), comment.getAuthor().getId());
        trackCommentRepository.delete(comment);
    }
}
