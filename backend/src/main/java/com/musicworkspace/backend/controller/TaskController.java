package com.musicworkspace.backend.controller;

import com.musicworkspace.backend.dto.CreateTaskRequest;
import com.musicworkspace.backend.dto.TaskResponse;
import com.musicworkspace.backend.dto.UpdateTaskRequest;
import com.musicworkspace.backend.service.TaskService;
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
@RequestMapping("/api/v1/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.create(projectId, request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> list(
            @PathVariable UUID projectId,
            Authentication authentication) {
        return ResponseEntity.ok(taskService.findAll(projectId, authentication.getName()));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getById(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            Authentication authentication) {
        return ResponseEntity.ok(taskService.findById(projectId, taskId, authentication.getName()));
    }

    @PatchMapping("/{taskId}")
    public ResponseEntity<TaskResponse> update(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(taskService.update(projectId, taskId, request, authentication.getName()));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            Authentication authentication) {
        taskService.delete(projectId, taskId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
