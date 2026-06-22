package com.musicworkspace.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicworkspace.backend.dto.CreateTaskRequest;
import com.musicworkspace.backend.dto.TaskResponse;
import com.musicworkspace.backend.dto.UpdateTaskRequest;
import com.musicworkspace.backend.dto.UserSummary;
import com.musicworkspace.backend.entity.TaskStatus;
import com.musicworkspace.backend.exception.TaskNotFoundException;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.TaskService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openapitools.jackson.nullable.JsonNullableModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TaskController.class)
@WithMockUser(username = "test@example.com")
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TaskService taskService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private UUID projectId;
    private UUID taskId;
    private TaskResponse response;

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JsonNullableModule());
        projectId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        UserSummary creator = new UserSummary(UUID.randomUUID(), "testuser");
        response = new TaskResponse(taskId, projectId, "Record guitar", null, TaskStatus.TODO,
                creator, null, Instant.now(), Instant.now());
    }

    @Test
    void create_returns201WithTask() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest("Record guitar", null, null);
        when(taskService.create(eq(projectId), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/projects/{projectId}/tasks", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Record guitar"))
                .andExpect(jsonPath("$.status").value("TODO"))
                .andExpect(jsonPath("$.projectId").value(projectId.toString()));
    }

    @Test
    void create_returns422WhenTitleBlank() throws Exception {
        CreateTaskRequest request = new CreateTaskRequest("", null, null);

        mockMvc.perform(post("/api/v1/projects/{projectId}/tasks", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void list_returns200WithTasks() throws Exception {
        when(taskService.findAll(eq(projectId), any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/projects/{projectId}/tasks", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Record guitar"));
    }

    @Test
    void getById_returns200WithTask() throws Exception {
        when(taskService.findById(eq(projectId), eq(taskId), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/projects/{projectId}/tasks/{taskId}", projectId, taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(taskId.toString()));
    }

    @Test
    void getById_returns404WhenTaskNotFound() throws Exception {
        when(taskService.findById(eq(projectId), eq(taskId), any()))
                .thenThrow(new TaskNotFoundException("Task not found"));

        mockMvc.perform(get("/api/v1/projects/{projectId}/tasks/{taskId}", projectId, taskId))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_returns200WithUpdatedTask() throws Exception {
        UpdateTaskRequest request = new UpdateTaskRequest("New title", null, TaskStatus.DOING, null);
        when(taskService.update(eq(projectId), eq(taskId), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/projects/{projectId}/tasks/{taskId}", projectId, taskId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void update_returns422WhenTitleBlank() throws Exception {
        mockMvc.perform(patch("/api/v1/projects/{projectId}/tasks/{taskId}", projectId, taskId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void delete_returns204() throws Exception {
        doNothing().when(taskService).delete(eq(projectId), eq(taskId), any());

        mockMvc.perform(delete("/api/v1/projects/{projectId}/tasks/{taskId}", projectId, taskId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
