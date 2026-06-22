package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.dto.TrackVersionMapper;
import com.musicworkspace.backend.dto.TrackVersionResponse;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.entity.TrackVersion;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.CloudinaryUploadException;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import org.springframework.web.server.ResponseStatusException;
import com.musicworkspace.backend.exception.TrackAlreadyArchivedException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.exception.TrackVersionNotFoundException;
import com.musicworkspace.backend.exception.VersionConflictException;
import com.musicworkspace.backend.repository.TrackVersionRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TrackVersionServiceTest {

    @Mock
    private TrackVersionRepository trackVersionRepository;

    @Mock
    private TrackVersionMapper trackVersionMapper;

    @Mock
    private ProjectAccessService projectAccessService;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private TrackVersionService trackVersionService;

    private static final String EMAIL = "test@example.com";
    private User owner;
    private UUID projectId;
    private UUID trackId;
    private UUID versionId;
    private Project project;
    private Track track;
    private TrackVersion version;
    private TrackVersionResponse response;

    private static final byte[] MP3_MAGIC_BYTES = {
            (byte) 0xFF, (byte) 0xFB, (byte) 0x90, 0x00
    };

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(trackVersionService, "audioFolder", "music-workspace/projects/%s/tracks/%s/versions");
        owner = User.builder().id(UUID.randomUUID()).email(EMAIL).username("testuser").build();
        projectId = UUID.randomUUID();
        trackId = UUID.randomUUID();
        versionId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(owner).name("My Album").build();
        track = Track.builder().id(trackId).project(project).name("Intro").status(TrackStatus.DRAFT).build();
        version = TrackVersion.builder().id(versionId).track(track).versionNumber(1).audioUrl("https://cloudinary.com/audio.mp3").notes("First take").build();
        response = new TrackVersionResponse(versionId, trackId, 1, "https://cloudinary.com/audio.mp3", "First take", Instant.now());
    }

    @Test
    void create_uploadsAudioAndSavesVersion() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", MP3_MAGIC_BYTES);

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId())).thenReturn(track);
        when(trackVersionRepository.findMaxVersionNumberByTrackId(trackId)).thenReturn(0);
        when(cloudinaryService.upload(any(), any(), any(), any(), any(Boolean.class)))
                .thenReturn("https://cloudinary.com/audio.mp3");
        when(trackVersionRepository.save(any(TrackVersion.class))).thenReturn(version);
        when(trackVersionMapper.toResponse(version)).thenReturn(response);

        TrackVersionResponse result = trackVersionService.create(projectId, trackId, "First take", file, EMAIL);

        assertThat(result).isEqualTo(response);
        verify(trackVersionRepository).save(any(TrackVersion.class));
    }

    @Test
    void create_incrementsVersionNumber() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", MP3_MAGIC_BYTES);

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId())).thenReturn(track);
        when(trackVersionRepository.findMaxVersionNumberByTrackId(trackId)).thenReturn(3);
        when(cloudinaryService.upload(any(), any(), any(), any(), any(Boolean.class)))
                .thenReturn("https://cloudinary.com/v4.mp3");

        TrackVersion savedVersion = TrackVersion.builder().id(versionId).track(track).versionNumber(4).audioUrl("https://cloudinary.com/v4.mp3").build();
        when(trackVersionRepository.save(any(TrackVersion.class))).thenReturn(savedVersion);
        TrackVersionResponse v4Response = new TrackVersionResponse(versionId, trackId, 4, "https://cloudinary.com/v4.mp3", null, Instant.now());
        when(trackVersionMapper.toResponse(savedVersion)).thenReturn(v4Response);

        TrackVersionResponse result = trackVersionService.create(projectId, trackId, null, file, EMAIL);

        assertThat(result.versionNumber()).isEqualTo(4);
    }

    @Test
    void create_throwsWhenTrackIsArchived() {
        Track archivedTrack = Track.builder().id(trackId).project(project).name("Intro").status(TrackStatus.DRAFT).archived(true).build();
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", MP3_MAGIC_BYTES);

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId())).thenReturn(archivedTrack);

        assertThatThrownBy(() -> trackVersionService.create(projectId, trackId, "notes", file, EMAIL))
                .isInstanceOf(TrackAlreadyArchivedException.class);
    }

    @Test
    void create_throwsWhenProjectNotFound() {
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", MP3_MAGIC_BYTES);

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId()))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> trackVersionService.create(projectId, trackId, "notes", file, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void create_throwsWhenTrackNotFound() {
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", MP3_MAGIC_BYTES);

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId()))
                .thenThrow(new TrackNotFoundException("Track not found"));

        assertThatThrownBy(() -> trackVersionService.create(projectId, trackId, "notes", file, EMAIL))
                .isInstanceOf(TrackNotFoundException.class);
    }

    @Test
    void create_throwsVersionConflictOnDuplicateVersionNumber() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", MP3_MAGIC_BYTES);

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId())).thenReturn(track);
        when(trackVersionRepository.findMaxVersionNumberByTrackId(trackId)).thenReturn(0);
        when(cloudinaryService.upload(any(), any(), any(), any(), any(Boolean.class)))
                .thenReturn("https://cloudinary.com/audio.mp3");
        when(trackVersionRepository.save(any(TrackVersion.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThatThrownBy(() -> trackVersionService.create(projectId, trackId, "notes", file, EMAIL))
                .isInstanceOf(VersionConflictException.class);
    }

    @Test
    void create_throwsCloudinaryUploadExceptionOnIOError() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", MP3_MAGIC_BYTES);

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId())).thenReturn(track);
        when(trackVersionRepository.findMaxVersionNumberByTrackId(trackId)).thenReturn(0);
        when(cloudinaryService.upload(any(), any(), any(), any(), any(Boolean.class)))
                .thenThrow(new CloudinaryUploadException("network error", new RuntimeException()));

        assertThatThrownBy(() -> trackVersionService.create(projectId, trackId, "notes", file, EMAIL))
                .isInstanceOf(CloudinaryUploadException.class);
    }

    @Test
    void findAll_returnsMappedListForTrack() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId())).thenReturn(track);
        when(trackVersionRepository.findByTrackId(trackId)).thenReturn(List.of(version));
        when(trackVersionMapper.toResponse(version)).thenReturn(response);

        List<TrackVersionResponse> result = trackVersionService.findAll(projectId, trackId, EMAIL);

        assertThat(result).containsExactly(response);
    }

    @Test
    void findAll_throwsWhenProjectNotFound() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId()))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> trackVersionService.findAll(projectId, trackId, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void findAll_throwsWhenTrackNotFound() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId()))
                .thenThrow(new TrackNotFoundException("Track not found"));

        assertThatThrownBy(() -> trackVersionService.findAll(projectId, trackId, EMAIL))
                .isInstanceOf(TrackNotFoundException.class);
    }

    @Test
    void findById_returnsVersion() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId())).thenReturn(track);
        when(trackVersionRepository.findByIdAndTrackId(versionId, trackId)).thenReturn(Optional.of(version));
        when(trackVersionMapper.toResponse(version)).thenReturn(response);

        TrackVersionResponse result = trackVersionService.findById(projectId, trackId, versionId, EMAIL);

        assertThat(result).isEqualTo(response);
    }

    @Test
    void findById_throwsWhenVersionNotFound() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId())).thenReturn(track);
        when(trackVersionRepository.findByIdAndTrackId(versionId, trackId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> trackVersionService.findById(projectId, trackId, versionId, EMAIL))
                .isInstanceOf(TrackVersionNotFoundException.class);
    }

    @Test
    void findById_throwsWhenProjectNotFound() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId()))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> trackVersionService.findById(projectId, trackId, versionId, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void findById_throwsWhenTrackNotFound() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveTrack(trackId, projectId, owner.getId()))
                .thenThrow(new TrackNotFoundException("Track not found"));

        assertThatThrownBy(() -> trackVersionService.findById(projectId, trackId, versionId, EMAIL))
                .isInstanceOf(TrackNotFoundException.class);
    }

    @Test
    void create_throwsWhenFileIsEmpty() {
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", new byte[0]);

        assertThatThrownBy(() -> trackVersionService.create(projectId, trackId, "notes", file, EMAIL))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("File must not be empty");
    }

    @Test
    void create_throwsWhenFileExceeds70MB() {
        byte[] largeContent = new byte[70 * 1024 * 1024 + 1];
        largeContent[0] = (byte) 0xFF;
        largeContent[1] = (byte) 0xFB;
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg", largeContent);

        assertThatThrownBy(() -> trackVersionService.create(projectId, trackId, "notes", file, EMAIL))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("File size must not exceed 70MB");
    }

    @Test
    void create_throwsWhenFileIsNotAudio() {
        MockMultipartFile file = new MockMultipartFile("file", "image.png", "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});

        assertThatThrownBy(() -> trackVersionService.create(projectId, trackId, "notes", file, EMAIL))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only audio files are accepted");
    }
}
