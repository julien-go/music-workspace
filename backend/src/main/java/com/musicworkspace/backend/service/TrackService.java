package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CreateTrackRequest;
import com.musicworkspace.backend.dto.TrackMapper;
import com.musicworkspace.backend.dto.TrackResponse;
import com.musicworkspace.backend.dto.UpdateTrackRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.exception.TrackAlreadyArchivedException;
import com.musicworkspace.backend.repository.TrackRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrackService {

    private final TrackRepository trackRepository;
    private final TrackMapper trackMapper;
    private final PermissionService permissionService;

    @Transactional
    public TrackResponse create(UUID projectId, CreateTrackRequest request, String email) {
        Project project = permissionService.checkProjectPermission(projectId, email, ProjectRole.COLLABORATOR);

        Track track = trackMapper.toEntity(request);
        track.setProject(project);
        if (track.getStatus() == null) {
            track.setStatus(TrackStatus.DRAFT);
        }
        return trackMapper.toResponse(trackRepository.saveAndFlush(track));
    }

    @Transactional(readOnly = true)
    public List<TrackResponse> findAll(UUID projectId, String email) {
        permissionService.checkProjectPermission(projectId, email, ProjectRole.VIEWER);
        return trackRepository.findByProjectIdAndArchivedFalse(projectId).stream()
                .map(trackMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrackResponse findById(UUID projectId, UUID trackId, String email) {
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.VIEWER);
        return trackMapper.toResponse(track);
    }

    @Transactional
    public TrackResponse update(UUID projectId, UUID trackId, UpdateTrackRequest request, String email) {
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.COLLABORATOR);

        if (request.name() != null) track.setName(request.name());
        if (request.description() != null) track.setDescription(request.description());
        if (request.status() != null) track.setStatus(request.status());

        return trackMapper.toResponse(track);
    }

    @Transactional
    public TrackResponse archive(UUID projectId, UUID trackId, String email) {
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.COLLABORATOR);
        if (track.isArchived()) {
            throw new TrackAlreadyArchivedException("Track is already archived");
        }
        track.setArchived(true);
        return trackMapper.toResponse(track);
    }
}
