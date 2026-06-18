package com.musicworkspace.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicworkspace.backend.dto.CreateProjectRequest;
import com.musicworkspace.backend.dto.ProjectResponse;
import com.musicworkspace.backend.dto.UpdateProjectRequest;
import com.musicworkspace.backend.dto.UserSummary;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.ProjectService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProjectController.class)
@WithMockUser(username = "test@example.com")
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private UUID projectId;
    private ProjectResponse projectResponse;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        projectResponse = new ProjectResponse(
                projectId, "My Album", "A description", null,
                new UserSummary(UUID.randomUUID(), "testuser"),
                Instant.now(), Instant.now());
    }

    @Test
    void createProject_returnsCreated() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest("My Album", "A description");
        when(projectService.create(any(), any())).thenReturn(projectResponse);

        mockMvc.perform(post("/api/v1/projects")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(projectId.toString()))
                .andExpect(jsonPath("$.name").value("My Album"))
                .andExpect(jsonPath("$.owner.username").value("testuser"));
    }

    @Test
    void createProject_returnsValidationErrorOnBlankName() throws Exception {
        CreateProjectRequest request = new CreateProjectRequest("", null);

        mockMvc.perform(post("/api/v1/projects")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void listProjects_returnsOk() throws Exception {
        when(projectService.findAll(any())).thenReturn(List.of(projectResponse));

        mockMvc.perform(get("/api/v1/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("My Album"));
    }

    @Test
    void getProject_returnsOk() throws Exception {
        when(projectService.findById(eq(projectId), any())).thenReturn(projectResponse);

        mockMvc.perform(get("/api/v1/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My Album"));
    }

    @Test
    void getProject_returnsNotFoundWhenNotOwner() throws Exception {
        when(projectService.findById(eq(projectId), any()))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        mockMvc.perform(get("/api/v1/projects/{id}", projectId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void updateProject_returnsOk() throws Exception {
        UpdateProjectRequest request = new UpdateProjectRequest("New Name", null);
        when(projectService.update(eq(projectId), any(), any())).thenReturn(projectResponse);

        mockMvc.perform(patch("/api/v1/projects/{id}", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My Album"));
    }

    @Test
    void deleteProject_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/{id}", projectId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteProject_returnsNotFoundWhenNotOwner() throws Exception {
        doThrow(new ProjectNotFoundException("Project not found"))
                .when(projectService).delete(eq(projectId), any());

        mockMvc.perform(delete("/api/v1/projects/{id}", projectId)
                        .with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void uploadCover_returnsOkWithUpdatedProject() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", "image/jpeg", "img".getBytes());
        when(projectService.uploadCover(eq(projectId), any(), any())).thenReturn(projectResponse);

        mockMvc.perform(multipart("/api/v1/projects/{id}/cover", projectId)
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("My Album"));
    }

    @Test
    void uploadCover_returnsNotFoundWhenNotOwner() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", "image/jpeg", "img".getBytes());
        when(projectService.uploadCover(eq(projectId), any(), any()))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        mockMvc.perform(multipart("/api/v1/projects/{id}/cover", projectId)
                        .file(file)
                        .with(csrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }
}
