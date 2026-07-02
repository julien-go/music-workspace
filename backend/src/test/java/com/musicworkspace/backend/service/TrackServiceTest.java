package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.dto.CommentMapper;
import com.musicworkspace.backend.dto.CreateTrackRequest;
import com.musicworkspace.backend.dto.ReorderTracksRequest;
import com.musicworkspace.backend.dto.TrackMapper;
import com.musicworkspace.backend.dto.TrackResponse;
import com.musicworkspace.backend.dto.UpdateTrackRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.TrackAlreadyArchivedException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.repository.TrackCommentRepository;
import com.musicworkspace.backend.repository.TrackRepository;
import com.musicworkspace.backend.repository.TrackVersionRepository;
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
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class TrackServiceTest {

    @Mock
    private TrackRepository trackRepository;

    @Mock
    private TrackVersionRepository trackVersionRepository;

    @Mock
    private TrackCommentRepository trackCommentRepository;

    @Mock
    private TrackMapper trackMapper;

    @Mock
    private CommentMapper commentMapper;

    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private TrackService trackService;

    private static final String EMAIL = "test@example.com";
    private UUID projectId;
    private UUID trackId;
    private Project project;
    private Track track;
    private TrackResponse response;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        trackId = UUID.randomUUID();
        project = Project.builder().id(projectId).name("My Album").build();
        track = Track.builder().id(trackId).project(project).name("Intro").status(TrackStatus.DRAFT).build();
        response = new TrackResponse(trackId, 0, "Intro", null, TrackStatus.DRAFT, false, Instant.now(), Instant.now(), 0, null, null);
    }

    private void stubEnrichment(UUID id) {
        when(trackVersionRepository.countByTrackId(id)).thenReturn(0L);
        when(trackVersionRepository.findTopByTrackIdOrderByVersionNumberDesc(id)).thenReturn(Optional.empty());
        when(trackCommentRepository.findTopByTrackIdOrderByCreatedAtDescIdDesc(id)).thenReturn(Optional.empty());
    }

    @Test
    void create_savesTrackWithDefaultStatusAndReturnsResponse() {
        CreateTrackRequest request = new CreateTrackRequest("Intro", null, null);
        Track mapped = Track.builder().name("Intro").build();

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(trackMapper.toEntity(request)).thenReturn(mapped);
        when(trackRepository.saveAndFlush(mapped)).thenReturn(track);
        stubEnrichment(trackId);
        when(trackMapper.toResponse(track, 0, null, null)).thenReturn(response);

        TrackResponse result = trackService.create(projectId, request, EMAIL);

        assertThat(result).isEqualTo(response);
        assertThat(mapped.getStatus()).isEqualTo(TrackStatus.DRAFT);
        assertThat(mapped.getProject()).isEqualTo(project);
    }

    @Test
    void create_respectsExplicitStatus() {
        CreateTrackRequest request = new CreateTrackRequest("Intro", null, TrackStatus.IN_PROGRESS);
        Track mapped = Track.builder().name("Intro").status(TrackStatus.IN_PROGRESS).build();

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(trackMapper.toEntity(request)).thenReturn(mapped);
        when(trackRepository.saveAndFlush(mapped)).thenReturn(track);
        stubEnrichment(trackId);
        when(trackMapper.toResponse(track, 0, null, null)).thenReturn(response);

        trackService.create(projectId, request, EMAIL);

        assertThat(mapped.getStatus()).isEqualTo(TrackStatus.IN_PROGRESS);
    }

    @Test
    void findAll_returnsMappedListForProjectOwner() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(project);
        when(trackRepository.findByProjectIdAndArchivedFalseOrderByPositionAsc(projectId)).thenReturn(List.of(track));
        when(trackVersionRepository.countsByTrackIds(List.of(trackId))).thenReturn(List.of());
        when(trackVersionRepository.findLatestNotesByTrackIds(List.of(trackId))).thenReturn(List.of());
        when(trackCommentRepository.findLatestByTrackIds(List.of(trackId))).thenReturn(List.of());
        when(trackMapper.toResponse(track, 0, null, null)).thenReturn(response);

        List<TrackResponse> result = trackService.findAll(projectId, EMAIL, false);

        assertThat(result).containsExactly(response);
    }

    @Test
    void findAll_archived_returnsMappedArchivedList() {
        Track archivedTrack = Track.builder().id(trackId).project(project).name("Intro")
                .status(TrackStatus.DRAFT).archived(true).build();

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER)).thenReturn(project);
        when(trackRepository.findByProjectIdAndArchivedTrueOrderByPositionAsc(projectId)).thenReturn(List.of(archivedTrack));
        when(trackVersionRepository.countsByTrackIds(List.of(trackId))).thenReturn(List.of());
        when(trackVersionRepository.findLatestNotesByTrackIds(List.of(trackId))).thenReturn(List.of());
        when(trackCommentRepository.findLatestByTrackIds(List.of(trackId))).thenReturn(List.of());
        when(trackMapper.toResponse(archivedTrack, 0, null, null)).thenReturn(response);

        List<TrackResponse> result = trackService.findAll(projectId, EMAIL, true);

        assertThat(result).containsExactly(response);
    }

    @Test
    void findAll_throwsNotFoundWhenProjectNotOwned() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.VIEWER))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> trackService.findAll(projectId, EMAIL, false))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void findById_returnsTrack() {
        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.VIEWER)).thenReturn(track);
        stubEnrichment(trackId);
        when(trackMapper.toResponse(track, 0, null, null)).thenReturn(response);

        TrackResponse result = trackService.findById(projectId, trackId, EMAIL);

        assertThat(result).isEqualTo(response);
    }

    @Test
    void findById_throwsNotFoundWhenTrackNotInProject() {
        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.VIEWER))
                .thenThrow(new TrackNotFoundException("Track not found"));

        assertThatThrownBy(() -> trackService.findById(projectId, trackId, EMAIL))
                .isInstanceOf(TrackNotFoundException.class);
    }

    @Test
    void update_updatesOnlyProvidedFields() {
        UpdateTrackRequest request = new UpdateTrackRequest("New Name", null, TrackStatus.DONE);

        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(track);
        stubEnrichment(trackId);
        when(trackMapper.toResponse(track, 0, null, null)).thenReturn(response);

        trackService.update(projectId, trackId, request, EMAIL);

        assertThat(track.getName()).isEqualTo("New Name");
        assertThat(track.getDescription()).isNull();
        assertThat(track.getStatus()).isEqualTo(TrackStatus.DONE);
    }

    @Test
    void update_throwsNotFoundWhenProjectNotOwned() {
        UpdateTrackRequest request = new UpdateTrackRequest("New Name", null, null);

        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.COLLABORATOR))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> trackService.update(projectId, trackId, request, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void archive_setsArchivedTrueAndReturnsResponse() {
        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(track);
        stubEnrichment(trackId);
        when(trackMapper.toResponse(track, 0, null, null)).thenReturn(response);

        trackService.archive(projectId, trackId, EMAIL);

        assertThat(track.isArchived()).isTrue();
    }

    @Test
    void archive_throwsNotFoundWhenTrackNotInProject() {
        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.COLLABORATOR))
                .thenThrow(new TrackNotFoundException("Track not found"));

        assertThatThrownBy(() -> trackService.archive(projectId, trackId, EMAIL))
                .isInstanceOf(TrackNotFoundException.class);
    }

    @Test
    void archive_throwsConflictWhenAlreadyArchived() {
        Track archivedTrack = Track.builder().id(trackId).project(project).name("Intro")
                .status(TrackStatus.DRAFT).archived(true).build();

        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(archivedTrack);

        assertThatThrownBy(() -> trackService.archive(projectId, trackId, EMAIL))
                .isInstanceOf(TrackAlreadyArchivedException.class);
    }

    @Test
    void unarchive_reappendsTrackAfterLastPosition() {
        Track archivedTrack = Track.builder().id(trackId).project(project).name("Intro")
                .status(TrackStatus.DRAFT).archived(true).position(3).build();

        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(archivedTrack);
        when(trackRepository.findMaxPositionByProjectId(projectId)).thenReturn(5);
        stubEnrichment(trackId);
        when(trackMapper.toResponse(archivedTrack, 0, null, null)).thenReturn(response);

        trackService.unarchive(projectId, trackId, EMAIL);

        assertThat(archivedTrack.isArchived()).isFalse();
        assertThat(archivedTrack.getPosition()).isEqualTo(6);
    }

    @Test
    void unarchive_leavesNonArchivedTrackUntouched() {
        track.setPosition(2);

        when(permissionService.checkTrackPermission(projectId, trackId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(track);
        stubEnrichment(trackId);
        when(trackMapper.toResponse(track, 0, null, null)).thenReturn(response);

        trackService.unarchive(projectId, trackId, EMAIL);

        assertThat(track.isArchived()).isFalse();
        assertThat(track.getPosition()).isEqualTo(2);
        verify(trackRepository, never()).findMaxPositionByProjectId(any());
    }

    @Test
    void reorder_appliesRequestedOrderAsPositions() {
        UUID otherId = UUID.randomUUID();
        Track other = Track.builder().id(otherId).project(project).name("Outro")
                .status(TrackStatus.DRAFT).position(1).build();
        track.setPosition(0);

        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(trackRepository.findByProjectIdAndArchivedFalseOrderByPositionAsc(projectId)).thenReturn(List.of(track, other));
        when(trackVersionRepository.countsByTrackIds(List.of(otherId, trackId))).thenReturn(List.of());
        when(trackVersionRepository.findLatestNotesByTrackIds(List.of(otherId, trackId))).thenReturn(List.of());
        when(trackCommentRepository.findLatestByTrackIds(List.of(otherId, trackId))).thenReturn(List.of());
        when(trackMapper.toResponse(any(Track.class), eq(0), isNull(), isNull())).thenReturn(response);

        trackService.reorder(projectId, new ReorderTracksRequest(List.of(otherId, trackId)), EMAIL);

        assertThat(other.getPosition()).isEqualTo(0);
        assertThat(track.getPosition()).isEqualTo(1);
    }

    @Test
    void reorder_throwsWhenTrackCountMismatch() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(trackRepository.findByProjectIdAndArchivedFalseOrderByPositionAsc(projectId)).thenReturn(List.of(track));

        ReorderTracksRequest request = new ReorderTracksRequest(List.of(trackId, UUID.randomUUID()));

        assertThatThrownBy(() -> trackService.reorder(projectId, request, EMAIL))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(422));
    }

    @Test
    void reorder_throwsWhenIdsDoNotMatchProjectTracks() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.COLLABORATOR)).thenReturn(project);
        when(trackRepository.findByProjectIdAndArchivedFalseOrderByPositionAsc(projectId)).thenReturn(List.of(track));

        ReorderTracksRequest request = new ReorderTracksRequest(List.of(UUID.randomUUID()));

        assertThatThrownBy(() -> trackService.reorder(projectId, request, EMAIL))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(422));
    }
}
