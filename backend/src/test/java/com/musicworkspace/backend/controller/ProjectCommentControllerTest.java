package com.musicworkspace.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicworkspace.backend.dto.CommentResponse;
import com.musicworkspace.backend.dto.CreateCommentRequest;
import com.musicworkspace.backend.dto.UserSummary;
import com.musicworkspace.backend.exception.CommentNotFoundException;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.ProjectCommentService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ProjectCommentController.class)
@WithMockUser(username = "test@example.com")
class ProjectCommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProjectCommentService projectCommentService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private UUID projectId;
    private UUID commentId;
    private CommentResponse response;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        commentId = UUID.randomUUID();
        response = new CommentResponse(commentId, "Great mix!",
                new UserSummary(UUID.randomUUID(), "testuser"), Instant.now());
    }

    @Test
    void create_returns201() throws Exception {
        CreateCommentRequest request = new CreateCommentRequest("Great mix!");
        when(projectCommentService.create(eq(projectId), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/projects/{projectId}/comments", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Great mix!"))
                .andExpect(jsonPath("$.author.username").value("testuser"));
    }

    @Test
    void create_returns422WhenContentBlank() throws Exception {
        CreateCommentRequest request = new CreateCommentRequest("");

        mockMvc.perform(post("/api/v1/projects/{projectId}/comments", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void create_returns404WhenNotMember() throws Exception {
        CreateCommentRequest request = new CreateCommentRequest("Great mix!");
        when(projectCommentService.create(eq(projectId), any(), any()))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        mockMvc.perform(post("/api/v1/projects/{projectId}/comments", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_returns200() throws Exception {
        when(projectCommentService.findAll(eq(projectId), any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/projects/{projectId}/comments", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("Great mix!"));
    }

    @Test
    void delete_returns204() throws Exception {
        doNothing().when(projectCommentService).delete(eq(projectId), eq(commentId), any());

        mockMvc.perform(delete("/api/v1/projects/{projectId}/comments/{commentId}", projectId, commentId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_returns404WhenCommentNotFound() throws Exception {
        doThrow(new CommentNotFoundException("Comment not found"))
                .when(projectCommentService).delete(eq(projectId), eq(commentId), any());

        mockMvc.perform(delete("/api/v1/projects/{projectId}/comments/{commentId}", projectId, commentId)
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }
}
