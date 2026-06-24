package com.musicworkspace.backend.controller;

import com.musicworkspace.backend.dto.CreateMemberRequest;
import com.musicworkspace.backend.dto.ProjectMemberResponse;
import com.musicworkspace.backend.dto.UpdateMemberRoleRequest;
import com.musicworkspace.backend.service.ProjectMemberService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/members")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    @PostMapping
    public ResponseEntity<ProjectMemberResponse> addMember(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateMemberRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectMemberService.addMember(projectId, request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<ProjectMemberResponse>> list(
            @PathVariable UUID projectId,
            Authentication authentication) {
        return ResponseEntity.ok(projectMemberService.findAll(projectId, authentication.getName()));
    }

    @PatchMapping("/{userId}")
    public ResponseEntity<ProjectMemberResponse> updateRole(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(projectMemberService.updateRole(projectId, userId, request, authentication.getName()));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            Authentication authentication) {
        projectMemberService.removeMember(projectId, userId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
