package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.ArgumentCaptor;

import com.musicworkspace.backend.dto.CreateTaskRequest;
import com.musicworkspace.backend.dto.TaskMapper;
import com.musicworkspace.backend.dto.TaskResponse;
import com.musicworkspace.backend.dto.UpdateTaskRequest;
import com.musicworkspace.backend.dto.UserSummary;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Task;
import com.musicworkspace.backend.entity.TaskStatus;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.TaskNotFoundException;
import com.musicworkspace.backend.exception.UserNotFoundException;
import com.musicworkspace.backend.repository.TaskRepository;
import com.musicworkspace.backend.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.openapitools.jackson.nullable.JsonNullable;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private TaskService taskService;

    private static final String EMAIL = "test@example.com";
    private User owner;
    private UUID projectId;
    private UUID taskId;
    private Project project;
    private Task task;
    private TaskResponse response;
    private UserSummary ownerSummary;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(UUID.randomUUID()).email(EMAIL).username("testuser").build();
        projectId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(owner).name("My Album").build();
        task = Task.builder().id(taskId).project(project).createdBy(owner).title("Record guitar")
                .status(TaskStatus.TODO).build();
        ownerSummary = new UserSummary(owner.getId(), "testuser");
        response = new TaskResponse(taskId, projectId, "Record guitar", null, TaskStatus.TODO,
                ownerSummary, null, Instant.now(), Instant.now());
    }

    @Test
    void create_savesTaskWithDefaultStatusTodo() {
        CreateTaskRequest request = new CreateTaskRequest("Record guitar", null, null);

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(permissionService.resolveUser(EMAIL)).thenReturn(owner);
        when(taskRepository.save(any(Task.class))).thenReturn(task);
        when(taskMapper.toResponse(task)).thenReturn(response);

        TaskResponse result = taskService.create(projectId, request, EMAIL);

        assertThat(result).isEqualTo(response);
        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        Task saved = captor.getValue();
        assertThat(saved.getTitle()).isEqualTo("Record guitar");
        assertThat(saved.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(saved.getCreatedBy()).isEqualTo(owner);
        assertThat(saved.getProject()).isEqualTo(project);
        assertThat(saved.getAssignedTo()).isNull();
    }

    @Test
    void create_assignsUserWhenAssignedToIdProvided() {
        User assignee = User.builder().id(UUID.randomUUID()).email("other@example.com").username("other").build();
        CreateTaskRequest request = new CreateTaskRequest("Record guitar", null, assignee.getId());

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(permissionService.resolveUser(EMAIL)).thenReturn(owner);
        when(userRepository.findById(assignee.getId())).thenReturn(Optional.of(assignee));
        when(taskRepository.save(any(Task.class))).thenReturn(task);
        when(taskMapper.toResponse(task)).thenReturn(response);

        taskService.create(projectId, request, EMAIL);

        ArgumentCaptor<Task> captor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository).save(captor.capture());
        assertThat(captor.getValue().getAssignedTo()).isEqualTo(assignee);
    }

    @Test
    void create_throwsWhenAssignedUserNotFound() {
        UUID fakeUserId = UUID.randomUUID();
        CreateTaskRequest request = new CreateTaskRequest("Record guitar", null, fakeUserId);

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(permissionService.resolveUser(EMAIL)).thenReturn(owner);
        when(userRepository.findById(fakeUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.create(projectId, request, EMAIL))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void create_throwsWhenProjectNotFound() {
        CreateTaskRequest request = new CreateTaskRequest("Record guitar", null, null);

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> taskService.create(projectId, request, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void findAll_returnsMappedListForProject() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(project);
        when(taskRepository.findByProjectId(projectId)).thenReturn(List.of(task));
        when(taskMapper.toResponse(task)).thenReturn(response);

        List<TaskResponse> result = taskService.findAll(projectId, EMAIL);

        assertThat(result).containsExactly(response);
    }

    @Test
    void findAll_throwsWhenProjectNotFound() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> taskService.findAll(projectId, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void findById_returnsTask() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.of(task));
        when(taskMapper.toResponse(task)).thenReturn(response);

        TaskResponse result = taskService.findById(projectId, taskId, EMAIL);

        assertThat(result).isEqualTo(response);
    }

    @Test
    void findById_throwsWhenTaskNotFound() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.findById(projectId, taskId, EMAIL))
                .isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void update_updatesOnlyProvidedFields() {
        UpdateTaskRequest request = new UpdateTaskRequest("New title", null, TaskStatus.DOING, null);

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.of(task));
        when(taskMapper.toResponse(task)).thenReturn(response);

        taskService.update(projectId, taskId, request, EMAIL);

        assertThat(task.getTitle()).isEqualTo("New title");
        assertThat(task.getStatus()).isEqualTo(TaskStatus.DOING);
        assertThat(task.getDescription()).isNull();
    }

    @Test
    void update_clearsDescriptionWhenExplicitNull() {
        task.setDescription("Old description");
        UpdateTaskRequest request = new UpdateTaskRequest(null, JsonNullable.of(null), null, null);

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.of(task));
        when(taskMapper.toResponse(task)).thenReturn(response);

        taskService.update(projectId, taskId, request, EMAIL);

        assertThat(task.getDescription()).isNull();
    }

    @Test
    void update_unassignsWhenAssignedToIdExplicitNull() {
        User assignee = User.builder().id(UUID.randomUUID()).email("other@example.com").username("other").build();
        task.setAssignedTo(assignee);
        UpdateTaskRequest request = new UpdateTaskRequest(null, null, null, JsonNullable.of(null));

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.of(task));
        when(taskMapper.toResponse(task)).thenReturn(response);

        taskService.update(projectId, taskId, request, EMAIL);

        assertThat(task.getAssignedTo()).isNull();
    }

    @Test
    void update_assignsNewUserWhenAssignedToIdProvided() {
        User assignee = User.builder().id(UUID.randomUUID()).email("other@example.com").username("other").build();
        UpdateTaskRequest request = new UpdateTaskRequest(null, null, null, JsonNullable.of(assignee.getId()));

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.of(task));
        when(userRepository.findById(assignee.getId())).thenReturn(Optional.of(assignee));
        when(taskMapper.toResponse(task)).thenReturn(response);

        taskService.update(projectId, taskId, request, EMAIL);

        assertThat(task.getAssignedTo()).isEqualTo(assignee);
    }

    @Test
    void update_throwsWhenAssignedUserNotFound() {
        UUID fakeUserId = UUID.randomUUID();
        UpdateTaskRequest request = new UpdateTaskRequest(null, null, null, JsonNullable.of(fakeUserId));

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.of(task));
        when(userRepository.findById(fakeUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.update(projectId, taskId, request, EMAIL))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void update_throwsWhenProjectNotFound() {
        UpdateTaskRequest request = new UpdateTaskRequest("New title", null, null, null);

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> taskService.update(projectId, taskId, request, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void update_throwsWhenTaskNotFound() {
        UpdateTaskRequest request = new UpdateTaskRequest("New title", null, null, null);

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.update(projectId, taskId, request, EMAIL))
                .isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void delete_removesTask() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.of(task));
        doNothing().when(permissionService).checkTaskDeletePermission(projectId, owner.getId(), EMAIL);

        taskService.delete(projectId, taskId, EMAIL);

        verify(taskRepository).delete(task);
    }

    @Test
    void delete_throwsWhenTaskNotFound() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.delete(projectId, taskId, EMAIL))
                .isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void delete_throwsWhenCollaboratorDeletesOtherUsersTask() {
        User otherUser = User.builder().id(UUID.randomUUID()).email("other@test.com").username("other").build();
        Task otherTask = Task.builder().id(taskId).project(project).createdBy(otherUser).title("Other task").status(TaskStatus.TODO).build();

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.of(otherTask));
        doThrow(new TaskNotFoundException("Task not found"))
                .when(permissionService).checkTaskDeletePermission(projectId, otherUser.getId(), EMAIL);

        assertThatThrownBy(() -> taskService.delete(projectId, taskId, EMAIL))
                .isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void delete_succeedsWhenCollaboratorDeletesOwnTask() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(taskRepository.findByIdAndProjectId(taskId, projectId)).thenReturn(Optional.of(task));
        doNothing().when(permissionService).checkTaskDeletePermission(projectId, owner.getId(), EMAIL);

        taskService.delete(projectId, taskId, EMAIL);

        verify(taskRepository).delete(task);
    }
}
