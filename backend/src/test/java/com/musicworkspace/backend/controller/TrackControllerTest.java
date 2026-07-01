package com.musicworkspace.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicworkspace.backend.dto.CreateTrackRequest;
import com.musicworkspace.backend.dto.TrackResponse;
import com.musicworkspace.backend.dto.UpdateTrackRequest;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.TrackService;
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

@WebMvcTest(TrackController.class)
@WithMockUser(username = "test@example.com")
class TrackControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TrackService trackService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private UUID projectId;
    private UUID trackId;
    private TrackResponse response;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        trackId = UUID.randomUUID();
        response = new TrackResponse(trackId, 0, "Intro", null, TrackStatus.DRAFT, false, Instant.now(), Instant.now(), 0, null, null);
    }

    @Test
    void list_returns200WithTracks() throws Exception {
        when(trackService.findAll(eq(projectId), any(), anyBoolean())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/projects/{projectId}/tracks", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Intro"))
                .andExpect(jsonPath("$[0].status").value("DRAFT"));
    }

    @Test
    void list_returns404WhenProjectNotOwned() throws Exception {
        when(trackService.findAll(eq(projectId), any(), anyBoolean())).thenThrow(new ProjectNotFoundException("Project not found"));

        mockMvc.perform(get("/api/v1/projects/{projectId}/tracks", projectId))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_returns201WithTrack() throws Exception {
        CreateTrackRequest request = new CreateTrackRequest("Intro", null, null);
        when(trackService.create(eq(projectId), any(), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/projects/{projectId}/tracks", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Intro"));
    }

    @Test
    void create_returns422WhenNameBlank() throws Exception {
        CreateTrackRequest request = new CreateTrackRequest("", null, null);

        mockMvc.perform(post("/api/v1/projects/{projectId}/tracks", projectId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void getById_returns200WithTrack() throws Exception {
        when(trackService.findById(eq(projectId), eq(trackId), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/projects/{projectId}/tracks/{trackId}", projectId, trackId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(trackId.toString()));
    }

    @Test
    void getById_returns404WhenTrackNotFound() throws Exception {
        when(trackService.findById(eq(projectId), eq(trackId), any())).thenThrow(new TrackNotFoundException("Track not found"));

        mockMvc.perform(get("/api/v1/projects/{projectId}/tracks/{trackId}", projectId, trackId))
                .andExpect(status().isNotFound());
    }

    @Test
    void update_returns200WithUpdatedTrack() throws Exception {
        UpdateTrackRequest request = new UpdateTrackRequest("New Name", null, TrackStatus.DONE);
        when(trackService.update(eq(projectId), eq(trackId), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/projects/{projectId}/tracks/{trackId}", projectId, trackId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void archive_returns200WithArchivedTrack() throws Exception {
        when(trackService.archive(eq(projectId), eq(trackId), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/projects/{projectId}/tracks/{trackId}/archive", projectId, trackId)
                        .with(csrf()))
                .andExpect(status().isOk());
    }
}
