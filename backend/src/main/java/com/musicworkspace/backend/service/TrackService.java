package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CommentMapper;
import com.musicworkspace.backend.dto.CommentResponse;
import com.musicworkspace.backend.dto.CreateTrackRequest;
import com.musicworkspace.backend.dto.TrackMapper;
import com.musicworkspace.backend.dto.TrackResponse;
import com.musicworkspace.backend.dto.UpdateTrackRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.exception.TrackAlreadyArchivedException;
import com.musicworkspace.backend.repository.TrackCommentRepository;
import com.musicworkspace.backend.repository.TrackRepository;
import com.musicworkspace.backend.repository.TrackVersionRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrackService {

    private final TrackRepository trackRepository;
    private final TrackVersionRepository trackVersionRepository;
    private final TrackCommentRepository trackCommentRepository;
    private final TrackMapper trackMapper;
    private final CommentMapper commentMapper;
    private final PermissionService permissionService;

    @Transactional
    public TrackResponse create(UUID projectId, CreateTrackRequest request, String email) {
        Project project = permissionService.checkProjectPermission(projectId, email, ProjectRole.COLLABORATOR);

        Track track = trackMapper.toEntity(request);
        track.setProject(project);
        if (track.getStatus() == null) {
            track.setStatus(TrackStatus.DRAFT);
        }
        return buildResponse(trackRepository.saveAndFlush(track));
    }

    @Transactional(readOnly = true)
    public List<TrackResponse> findAll(UUID projectId, String email, boolean archived) {
        permissionService.checkProjectPermission(projectId, email, ProjectRole.VIEWER);
        List<Track> tracks = archived
                ? trackRepository.findByProjectIdAndArchivedTrue(projectId)
                : trackRepository.findByProjectIdAndArchivedFalse(projectId);
        return enrichTracks(tracks);
    }

    @Transactional(readOnly = true)
    public TrackResponse findById(UUID projectId, UUID trackId, String email) {
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.VIEWER);
        return buildResponse(track);
    }

    @Transactional
    public TrackResponse update(UUID projectId, UUID trackId, UpdateTrackRequest request, String email) {
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.COLLABORATOR);

        if (track.isArchived()) {
            throw new TrackAlreadyArchivedException("Cannot update an archived track");
        }

        if (request.name() != null) track.setName(request.name());
        if (request.description() != null) track.setDescription(request.description());
        if (request.status() != null) track.setStatus(request.status());

        return buildResponse(track);
    }

    @Transactional
    public TrackResponse archive(UUID projectId, UUID trackId, String email) {
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.COLLABORATOR);
        if (track.isArchived()) {
            throw new TrackAlreadyArchivedException("Track is already archived");
        }
        track.setArchived(true);
        return buildResponse(track);
    }

    @Transactional
    public TrackResponse unarchive(UUID projectId, UUID trackId, String email) {
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.COLLABORATOR);
        track.setArchived(false);
        return buildResponse(track);
    }

    private List<TrackResponse> enrichTracks(List<Track> tracks) {
        if (tracks.isEmpty()) return List.of();
        List<UUID> trackIds = tracks.stream().map(Track::getId).toList();

        Map<UUID, Integer> versionCounts = new HashMap<>();
        trackVersionRepository.countsByTrackIds(trackIds)
                .forEach(p -> versionCounts.put(p.getTrackId(), (int) p.getCount()));

        Map<UUID, String> lastNotes = new HashMap<>();
        trackVersionRepository.findLatestNotesByTrackIds(trackIds)
                .forEach(p -> lastNotes.put(p.getTrackId(), p.getNotes()));

        Map<UUID, CommentResponse> lastComments = new HashMap<>();
        trackCommentRepository.findLatestByTrackIds(trackIds)
                .forEach(tc -> lastComments.put(tc.getTrack().getId(), commentMapper.toResponse(tc)));

        return tracks.stream()
                .map(track -> {
                    UUID id = track.getId();
                    return trackMapper.toResponse(
                            track,
                            versionCounts.getOrDefault(id, 0),
                            lastNotes.get(id),
                            lastComments.get(id));
                })
                .toList();
    }

    private TrackResponse buildResponse(Track track) {
        UUID id = track.getId();
        int versionCount = (int) trackVersionRepository.countByTrackId(id);
        String lastVersionNote = trackVersionRepository
                .findTopByTrackIdOrderByVersionNumberDesc(id)
                .map(v -> v.getNotes())
                .orElse(null);
        CommentResponse lastComment = trackCommentRepository
                .findTopByTrackIdOrderByCreatedAtDescIdDesc(id)
                .map(commentMapper::toResponse)
                .orElse(null);
        return trackMapper.toResponse(track, versionCount, lastVersionNote, lastComment);
    }
}
