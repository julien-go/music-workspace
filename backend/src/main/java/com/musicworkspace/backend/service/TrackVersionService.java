package com.musicworkspace.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.musicworkspace.backend.dto.TrackVersionMapper;
import com.musicworkspace.backend.dto.TrackVersionResponse;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackVersion;
import com.musicworkspace.backend.exception.CloudinaryUploadException;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.exception.TrackAlreadyArchivedException;
import com.musicworkspace.backend.exception.TrackNotFoundException;
import com.musicworkspace.backend.exception.TrackVersionNotFoundException;
import com.musicworkspace.backend.exception.VersionConflictException;
import com.musicworkspace.backend.repository.ProjectRepository;
import com.musicworkspace.backend.repository.TrackRepository;
import com.musicworkspace.backend.repository.TrackVersionRepository;
import com.musicworkspace.backend.repository.UserRepository;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class TrackVersionService {

    private final TrackVersionRepository trackVersionRepository;
    private final TrackRepository trackRepository;
    private final ProjectRepository projectRepository;
    private final TrackVersionMapper trackVersionMapper;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    @Value("${cloudinary.folder.audio}")
    private String audioFolder;

    @Transactional
    public TrackVersionResponse create(UUID projectId, UUID trackId, String notes, MultipartFile file, String email) {
        UUID ownerId = resolveOwnerId(email);
        resolveProject(projectId, ownerId);
        Track track = resolveTrack(trackId, projectId);

        if (track.isArchived()) {
            throw new TrackAlreadyArchivedException("Cannot add a version to an archived track");
        }

        int nextVersion = trackVersionRepository.findMaxVersionNumberByTrackId(trackId) + 1;
        String audioUrl = uploadAudio(file, projectId, trackId, nextVersion);

        TrackVersion version = TrackVersion.builder()
                .track(track)
                .versionNumber(nextVersion)
                .audioUrl(audioUrl)
                .notes(notes)
                .build();

        try {
            return trackVersionMapper.toResponse(trackVersionRepository.save(version));
        } catch (DataIntegrityViolationException e) {
            throw new VersionConflictException("Version number conflict, please retry");
        }
    }

    @Transactional(readOnly = true)
    public List<TrackVersionResponse> findAll(UUID projectId, UUID trackId, String email) {
        UUID ownerId = resolveOwnerId(email);
        resolveProject(projectId, ownerId);
        resolveTrack(trackId, projectId);
        return trackVersionRepository.findByTrackId(trackId).stream()
                .map(trackVersionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrackVersionResponse findById(UUID projectId, UUID trackId, UUID versionId, String email) {
        UUID ownerId = resolveOwnerId(email);
        resolveProject(projectId, ownerId);
        resolveTrack(trackId, projectId);
        return trackVersionMapper.toResponse(
                trackVersionRepository.findByIdAndTrackId(versionId, trackId)
                        .orElseThrow(() -> new TrackVersionNotFoundException("Track version not found"))
        );
    }

    private String uploadAudio(MultipartFile file, UUID projectId, UUID trackId, int versionNumber) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", String.format(audioFolder, projectId, trackId),
                            "public_id", "v" + versionNumber,
                            "resource_type", "video",
                            "overwrite", false
                    )
            );
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new CloudinaryUploadException("Failed to upload audio file", e);
        }
    }

    private void resolveProject(UUID projectId, UUID ownerId) {
        projectRepository.findByIdAndOwnerId(projectId, ownerId)
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
