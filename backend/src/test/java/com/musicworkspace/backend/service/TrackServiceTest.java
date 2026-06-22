package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.dto.CreateTrackRequest;
import com.musicworkspace.backend.dto.TrackMapper;
import com.musicworkspace.backend.dto.TrackResponse;
import com.musicworkspace.backend.dto.UpdateTrackRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.TrackAlreadyArchivedException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.repository.TrackRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TrackServiceTest {

    @Mock
    private TrackRepository trackRepository;

    @Mock
    private TrackMapper trackMapper;

    @Mock
    private ProjectAccessService projectAccessService;

    @InjectMocks
    private TrackService trackService;

    private static final String EMAIL = "test@example.com";
    private User owner;
    private UUID projectId;
    private UUID trackId;
    private Project project;
    private Track track;
    private TrackResponse response;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(UUID.randomUUID()).email(EMAIL).username("testuser").build();
        projectId = UUID.randomUUID();
        trackId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(owner).name("My Album").build();
        track = Track.builder().id(trackId).project(project).name("Intro").status(TrackStatus.DRAFT).build();
        response = new TrackResponse(trackId, "Intro", null, TrackStatus.DRAFT, false, Instant.now(), Instant.now());
    }

    @Test
    void create_savesTrackWithDefaultStatusAndReturnsResponse() {
        CreateTrackRequest request = new CreateTrackRequest("Intro", null, null);
        Track mapped = Track.builder().name("Intro").build();

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(trackMapper.toEntity(request)).thenReturn(mapped);
        when(trackRepository.save(mapped)).thenReturn(track);
        when(trackMapper.toResponse(track)).thenReturn(response);

        TrackResponse result = trackService.create(projectId, request, EMAIL);

        assertThat(result).isEqualTo(response);
        assertThat(mapped.getStatus()).isEqualTo(TrackStatus.DRAFT);
        assertThat(mapped.getProject()).isEqualTo(project);
    }

    @Test
    void create_respectsExplicitStatus() {
        CreateTrackRequest request = new CreateTrackRequest("Intro", null, TrackStatus.IN_PROGRESS);
        Track mapped = Track.builder().name("Intro").status(TrackStatus.IN_PROGRESS).build();

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(trackMapper.toEntity(request)).thenReturn(mapped);
        when(trackRepository.save(mapped)).thenReturn(track);
        when(trackMapper.toResponse(track)).thenReturn(response);

        trackService.create(projectId, request, EMAIL);

        assertThat(mapped.getStatus()).isEqualTo(TrackStatus.IN_PROGRESS);
    }

    @Test
    void findAll_returnsMappedListForProjectOwner() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(trackRepository.findByProjectIdAndArchivedFalse(projectId)).thenReturn(List.of(track));
        when(trackMapper.toResponse(track)).thenReturn(response);

        List<TrackResponse> result = trackService.findAll(projectId, EMAIL);

        assertThat(result).containsExactly(response);
    }

    @Test
    void findAll_throwsNotFoundWhenProjectNotOwned() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId()))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> trackService.findAll(projectId, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void findById_returnsTrack() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectAccessService.resolveTrack(trackId, projectId)).thenReturn(track);
        when(trackMapper.toResponse(track)).thenReturn(response);

        TrackResponse result = trackService.findById(projectId, trackId, EMAIL);

        assertThat(result).isEqualTo(response);
    }

    @Test
    void findById_throwsNotFoundWhenTrackNotInProject() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectAccessService.resolveTrack(trackId, projectId))
                .thenThrow(new TrackNotFoundException("Track not found"));

        assertThatThrownBy(() -> trackService.findById(projectId, trackId, EMAIL))
                .isInstanceOf(TrackNotFoundException.class);
    }

    @Test
    void update_updatesOnlyProvidedFields() {
        UpdateTrackRequest request = new UpdateTrackRequest("New Name", null, TrackStatus.DONE);

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectAccessService.resolveTrack(trackId, projectId)).thenReturn(track);
        when(trackMapper.toResponse(track)).thenReturn(response);

        trackService.update(projectId, trackId, request, EMAIL);

        assertThat(track.getName()).isEqualTo("New Name");
        assertThat(track.getDescription()).isNull();
        assertThat(track.getStatus()).isEqualTo(TrackStatus.DONE);
    }

    @Test
    void update_throwsNotFoundWhenProjectNotOwned() {
        UpdateTrackRequest request = new UpdateTrackRequest("New Name", null, null);

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId()))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> trackService.update(projectId, trackId, request, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void archive_setsArchivedTrueAndReturnsResponse() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectAccessService.resolveTrack(trackId, projectId)).thenReturn(track);
        when(trackMapper.toResponse(track)).thenReturn(response);

        trackService.archive(projectId, trackId, EMAIL);

        assertThat(track.isArchived()).isTrue();
    }

    @Test
    void archive_throwsNotFoundWhenTrackNotInProject() {
        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectAccessService.resolveTrack(trackId, projectId))
                .thenThrow(new TrackNotFoundException("Track not found"));

        assertThatThrownBy(() -> trackService.archive(projectId, trackId, EMAIL))
                .isInstanceOf(TrackNotFoundException.class);
    }

    @Test
    void archive_throwsConflictWhenAlreadyArchived() {
        Track archivedTrack = Track.builder().id(trackId).project(project).name("Intro")
                .status(TrackStatus.DRAFT).archived(true).build();

        when(projectAccessService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectAccessService.resolveOwnedProject(projectId, owner.getId())).thenReturn(project);
        when(projectAccessService.resolveTrack(trackId, projectId)).thenReturn(archivedTrack);

        assertThatThrownBy(() -> trackService.archive(projectId, trackId, EMAIL))
                .isInstanceOf(TrackAlreadyArchivedException.class);
    }
}
