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
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.TrackCommentService;
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

@WebMvcTest(TrackCommentController.class)
@WithMockUser(username = "test@example.com")
class TrackCommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TrackCommentService trackCommentService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private UUID projectId;
    private UUID trackId;
    private UUID commentId;
    private CommentResponse response;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        trackId = UUID.randomUUID();
        commentId = UUID.randomUUID();
        response = new CommentResponse(commentId, "Sounds great",
                new UserSummary(UUID.randomUUID(), "testuser"), Instant.now());
    }

    @Test
    void create_returns201() throws Exception {
        CreateCommentRequest request = new CreateCommentRequest("Sounds great");
        when(trackCommentService.create(eq(projectId), eq(trackId), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/projects/{projectId}/tracks/{trackId}/comments", projectId, trackId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Sounds great"));
    }

    @Test
    void create_returns404WhenTrackNotFound() throws Exception {
        CreateCommentRequest request = new CreateCommentRequest("Sounds great");
        when(trackCommentService.create(eq(projectId), eq(trackId), any(), any()))
                .thenThrow(new TrackNotFoundException("Track not found"));

        mockMvc.perform(post("/api/v1/projects/{projectId}/tracks/{trackId}/comments", projectId, trackId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void list_returns200() throws Exception {
        when(trackCommentService.findAll(eq(projectId), eq(trackId), any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/projects/{projectId}/tracks/{trackId}/comments", projectId, trackId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("Sounds great"));
    }

    @Test
    void delete_returns204() throws Exception {
        doNothing().when(trackCommentService).delete(eq(projectId), eq(trackId), eq(commentId), any());

        mockMvc.perform(delete("/api/v1/projects/{projectId}/tracks/{trackId}/comments/{commentId}", projectId, trackId, commentId)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_returns404WhenCommentNotFound() throws Exception {
        doThrow(new CommentNotFoundException("Comment not found"))
                .when(trackCommentService).delete(eq(projectId), eq(trackId), eq(commentId), any());

        mockMvc.perform(delete("/api/v1/projects/{projectId}/tracks/{trackId}/comments/{commentId}", projectId, trackId, commentId)
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }
}
