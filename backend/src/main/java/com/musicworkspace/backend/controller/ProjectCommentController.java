package com.musicworkspace.backend.controller;

import com.musicworkspace.backend.dto.CommentResponse;
import com.musicworkspace.backend.dto.CreateCommentRequest;
import com.musicworkspace.backend.service.ProjectCommentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/comments")
@RequiredArgsConstructor
public class ProjectCommentController {

    private final ProjectCommentService projectCommentService;

    @PostMapping
    public ResponseEntity<CommentResponse> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectCommentService.create(projectId, request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> list(
            @PathVariable UUID projectId,
            Authentication authentication) {
        return ResponseEntity.ok(projectCommentService.findAll(projectId, authentication.getName()));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID commentId,
            Authentication authentication) {
        projectCommentService.delete(projectId, commentId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
