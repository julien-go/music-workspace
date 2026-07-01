package com.musicworkspace.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.musicworkspace.backend.dto.TrackVersionResponse;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.TrackVersionService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TrackVersionController.class)
@WithMockUser(username = "test@example.com")
class TrackVersionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TrackVersionService trackVersionService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private UUID projectId;
    private UUID trackId;
    private UUID versionId;
    private TrackVersionResponse response;

    private static final byte[] MP3_MAGIC_BYTES = {
            (byte) 0xFF, (byte) 0xFB, (byte) 0x90, 0x00
    };

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        trackId = UUID.randomUUID();
        versionId = UUID.randomUUID();
        response = new TrackVersionResponse(versionId, trackId, 1, "https://cloudinary.com/audio.mp3", "First take", "Rough mix", "track.mp3", Instant.now(), Instant.now());
    }

    @Test
    void create_returns201WithValidAudioFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", MP3_MAGIC_BYTES);
        when(trackVersionService.create(eq(projectId), eq(trackId), any(), any(), any(), any())).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/projects/{projectId}/tracks/{trackId}/versions", projectId, trackId)
                        .file(file)
                        .param("notes", "First take")
                        .param("label", "Rough mix")
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.versionNumber").value(1))
                .andExpect(jsonPath("$.trackId").value(trackId.toString()))
                .andExpect(jsonPath("$.label").value("Rough mix"))
                .andExpect(jsonPath("$.originalFileName").value("track.mp3"));
    }

    @Test
    void list_returns200WithVersions() throws Exception {
        when(trackVersionService.findAll(eq(projectId), eq(trackId), any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/projects/{projectId}/tracks/{trackId}/versions", projectId, trackId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].versionNumber").value(1))
                .andExpect(jsonPath("$[0].trackId").value(trackId.toString()));
    }

    @Test
    void update_returns200WithUpdatedVersion() throws Exception {
        when(trackVersionService.update(eq(projectId), eq(trackId), eq(versionId), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/projects/{projectId}/tracks/{trackId}/versions/{versionId}", projectId, trackId, versionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"label\":\"Rough mix\",\"notes\":\"First take\"}")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.label").value("Rough mix"))
                .andExpect(jsonPath("$.notes").value("First take"));
    }

    @Test
    void getById_returns200WithVersion() throws Exception {
        when(trackVersionService.findById(eq(projectId), eq(trackId), eq(versionId), any())).thenReturn(response);

        mockMvc.perform(get("/api/v1/projects/{projectId}/tracks/{trackId}/versions/{versionId}", projectId, trackId, versionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(versionId.toString()));
    }
}
