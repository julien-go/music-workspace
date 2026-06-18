package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CreateTrackRequest;
import com.musicworkspace.backend.dto.TrackMapper;
import com.musicworkspace.backend.dto.TrackResponse;
import com.musicworkspace.backend.dto.UpdateTrackRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackStatus;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.TrackAlreadyArchivedException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.repository.ProjectRepository;
import com.musicworkspace.backend.repository.TrackRepository;
import com.musicworkspace.backend.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrackService {

    private final TrackRepository trackRepository;
    private final ProjectRepository projectRepository;
    private final TrackMapper trackMapper;
    private final UserRepository userRepository;

    @Transactional
    public TrackResponse create(UUID projectId, CreateTrackRequest request, String email) {
        UUID ownerId = resolveOwnerId(email);
        Project project = resolveProject(projectId, ownerId);

        Track track = trackMapper.toEntity(request);
        track.setProject(project);
        if (track.getStatus() == null) {
            track.setStatus(TrackStatus.DRAFT);
        }
        return trackMapper.toResponse(trackRepository.save(track));
    }

    @Transactional(readOnly = true)
    public List<TrackResponse> findAll(UUID projectId, String email) {
        UUID ownerId = resolveOwnerId(email);
        resolveProject(projectId, ownerId);
        return trackRepository.findByProjectIdAndArchivedFalse(projectId).stream()
                .map(trackMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrackResponse findById(UUID projectId, UUID trackId, String email) {
        UUID ownerId = resolveOwnerId(email);
        resolveProject(projectId, ownerId);
        return trackMapper.toResponse(resolveTrack(trackId, projectId));
    }

    @Transactional
    public TrackResponse update(UUID projectId, UUID trackId, UpdateTrackRequest request, String email) {
        UUID ownerId = resolveOwnerId(email);
        resolveProject(projectId, ownerId);
        Track track = resolveTrack(trackId, projectId);

        if (request.name() != null) track.setName(request.name());
        if (request.description() != null) track.setDescription(request.description());
        if (request.status() != null) track.setStatus(request.status());

        return trackMapper.toResponse(track);
    }

    @Transactional
    public TrackResponse archive(UUID projectId, UUID trackId, String email) {
        UUID ownerId = resolveOwnerId(email);
        resolveProject(projectId, ownerId);
        Track track = resolveTrack(trackId, projectId);
        if (track.isArchived()) {
            throw new TrackAlreadyArchivedException("Track is already archived");
        }
        track.setArchived(true);
        return trackMapper.toResponse(track);
    }

    private Project resolveProject(UUID projectId, UUID ownerId) {
        return projectRepository.findByIdAndOwnerId(projectId, ownerId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
    }

    private Track resolveTrack(UUID trackId, UUID projectId) {
        return trackRepository.findByIdAndProjectId(trackId, projectId)
                .orElseThrow(() -> new TrackNotFoundException("Track not found"));
    }

    private UUID resolveOwnerId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email))
                .getId();
    }
}
