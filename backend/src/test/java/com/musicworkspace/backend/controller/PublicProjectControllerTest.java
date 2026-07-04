package com.musicworkspace.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.musicworkspace.backend.config.AuthRateLimiter;
import com.musicworkspace.backend.dto.PublicProjectResponse;
import com.musicworkspace.backend.dto.PublicProjectResponse.PublicTrackResponse;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.ProjectService;
import java.util.List;
import java.util.UUID;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(PublicProjectController.class)
@AutoConfigureMockMvc(addFilters = false)
class PublicProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private AuthRateLimiter authRateLimiter;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Test
    void getById_returnsPublicProjectWithCacheHeader() throws Exception {
        UUID projectId = UUID.randomUUID();
        PublicProjectResponse response = new PublicProjectResponse(
                projectId, "My Album", "Desc", null, "john",
                List.of(new PublicTrackResponse(
                        UUID.randomUUID(), "Intro", TrackStatus.DRAFT, 3,
                        UUID.randomUUID(), 3, "https://cloud/audio.mp3")));
        when(projectService.findPublic(projectId)).thenReturn(response);

        mockMvc.perform(get("/api/v1/public/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", Matchers.containsString("max-age=60")))
                .andExpect(jsonPath("$.owner").value("john"))
                .andExpect(jsonPath("$.tracks[0].latestAudioUrl").value("https://cloud/audio.mp3"))
                .andExpect(jsonPath("$.tracks[0].latestVersionNumber").value(3));
    }

    @Test
    void getById_returns404WhenPrivateOrMissing() throws Exception {
        UUID projectId = UUID.randomUUID();
        when(projectService.findPublic(projectId))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        mockMvc.perform(get("/api/v1/public/projects/{id}", projectId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void getById_returns429WhenRateLimited() throws Exception {
        UUID projectId = UUID.randomUUID();
        doThrow(new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Trop de tentatives, réessaie dans un instant."))
                .when(authRateLimiter).checkPublicProject(any());

        mockMvc.perform(get("/api/v1/public/projects/{id}", projectId))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").value("TOO_MANY_REQUESTS"));
    }
}
