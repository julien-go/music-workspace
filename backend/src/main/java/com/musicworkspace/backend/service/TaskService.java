package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CreateTaskRequest;
import com.musicworkspace.backend.dto.TaskMapper;
import com.musicworkspace.backend.dto.TaskResponse;
import com.musicworkspace.backend.dto.UpdateTaskRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Task;
import com.musicworkspace.backend.entity.TaskStatus;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.MemberNotFoundException;
import com.musicworkspace.backend.exception.TaskNotFoundException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.TaskRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.openapitools.jackson.nullable.JsonNullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskMapper taskMapper;
    private final PermissionService permissionService;

    @Transactional
    public TaskResponse create(UUID projectId, CreateTaskRequest request, String email) {
        Project project = permissionService.checkProjectPermission(projectId, email, ProjectRole.COLLABORATOR);
        User creator = permissionService.resolveUser(email);

        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .project(project)
                .createdBy(creator)
                .status(TaskStatus.TODO)
                .assignedTo(request.assignedToId() != null ? resolveAssignee(projectId, request.assignedToId()) : null)
                .build();

        return taskMapper.toResponse(taskRepository.saveAndFlush(task));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findAll(UUID projectId, String email) {
        permissionService.checkProjectPermission(projectId, email, ProjectRole.VIEWER);
        return taskRepository.findByProjectId(projectId).stream()
                .map(taskMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse findById(UUID projectId, UUID taskId, String email) {
        permissionService.checkProjectPermission(projectId, email, ProjectRole.VIEWER);
        return taskMapper.toResponse(resolveTask(taskId, projectId));
    }

    @Transactional
    public TaskResponse update(UUID projectId, UUID taskId, UpdateTaskRequest request, String email) {
        permissionService.checkProjectPermission(projectId, email, ProjectRole.COLLABORATOR);
        Task task = resolveTask(taskId, projectId);

        if (request.title() != null) task.setTitle(request.title());
        if (request.status() != null) task.setStatus(request.status());

        if (isProvided(request.description())) {
            task.setDescription(request.description().get());
        }

        if (isProvided(request.assignedToId())) {
            UUID assigneeId = request.assignedToId().get();
            task.setAssignedTo(assigneeId != null ? resolveAssignee(projectId, assigneeId) : null);
        }

        return taskMapper.toResponse(task);
    }

    @Transactional
    public void delete(UUID projectId, UUID taskId, String email) {
        ProjectMember member = permissionService.resolveMembership(projectId, email, ProjectRole.COLLABORATOR);
        Task task = resolveTask(taskId, projectId);
        permissionService.checkTaskDeletePermission(member.getRole(), member.getUser().getId(), task.getCreatedBy().getId());
        taskRepository.delete(task);
    }

    private Task resolveTask(UUID taskId, UUID projectId) {
        return taskRepository.findByIdAndProjectId(taskId, projectId)
                .orElseThrow(() -> new TaskNotFoundException("Task not found"));
    }

    private User resolveAssignee(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new MemberNotFoundException("Assigned user is not a member of this project"))
                .getUser();
    }

    private static boolean isProvided(JsonNullable<?> nullable) {
        return nullable != null && nullable.isPresent();
    }
}
