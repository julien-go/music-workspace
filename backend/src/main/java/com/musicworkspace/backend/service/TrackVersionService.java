package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.TrackVersionMapper;
import com.musicworkspace.backend.dto.TrackVersionResponse;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackVersion;
import com.musicworkspace.backend.exception.FileValidationException;
import com.musicworkspace.backend.exception.TrackAlreadyArchivedException;
import com.musicworkspace.backend.exception.TrackVersionNotFoundException;
import com.musicworkspace.backend.exception.VersionConflictException;
import com.musicworkspace.backend.repository.TrackVersionRepository;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class TrackVersionService {

    private final TrackVersionRepository trackVersionRepository;
    private final TrackVersionMapper trackVersionMapper;
    private final PermissionService permissionService;
    private final CloudinaryService cloudinaryService;

    private static final long MAX_FILE_SIZE = 70 * 1024 * 1024;
    private static final Tika TIKA = new Tika();

    @Value("${cloudinary.folder.audio}")
    private String audioFolder;

    @Transactional
    public TrackVersionResponse create(UUID projectId, UUID trackId, String notes, MultipartFile file, String email) {
        validateAudioFile(file);
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.COLLABORATOR);

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
            return trackVersionMapper.toResponse(trackVersionRepository.saveAndFlush(version));
        } catch (DataIntegrityViolationException e) {
            throw new VersionConflictException("Version number conflict, please retry");
        }
    }

    @Transactional(readOnly = true)
    public List<TrackVersionResponse> findAll(UUID projectId, UUID trackId, String email) {
        permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.VIEWER);
        return trackVersionRepository.findByTrackId(trackId).stream()
                .map(trackVersionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrackVersionResponse findById(UUID projectId, UUID trackId, UUID versionId, String email) {
        TrackVersion version = permissionService.checkTrackVersionPermission(projectId, trackId, versionId, email, ProjectRole.VIEWER);
        return trackVersionMapper.toResponse(version);
    }

    private void validateAudioFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileValidationException("File must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileValidationException("File size must not exceed 70MB");
        }
        try (InputStream is = file.getInputStream()) {
            String detectedType = TIKA.detect(is, file.getOriginalFilename());
            if (detectedType == null || !detectedType.startsWith("audio/")) {
                throw new FileValidationException("Only audio files are accepted");
            }
        } catch (IOException e) {
            throw new FileValidationException("Could not read uploaded file");
        }
    }

    private String uploadAudio(MultipartFile file, UUID projectId, UUID trackId, int versionNumber) {
        return cloudinaryService.upload(
                file, String.format(audioFolder, projectId, trackId),
                "v" + versionNumber, "video", false);
    }
}
