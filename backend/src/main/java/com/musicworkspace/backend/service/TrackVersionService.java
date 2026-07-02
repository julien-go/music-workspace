package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.TrackVersionMapper;
import com.musicworkspace.backend.dto.TrackVersionResponse;
import com.musicworkspace.backend.dto.UpdateTrackVersionRequest;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackVersion;
import com.musicworkspace.backend.exception.FileValidationException;
import com.musicworkspace.backend.exception.TrackAlreadyArchivedException;
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
    public TrackVersionResponse create(UUID projectId, UUID trackId, String notes, String label, MultipartFile file, String email) {
        validateAudioFile(file);
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.COLLABORATOR);

        if (track.isArchived()) {
            throw new TrackAlreadyArchivedException("Cannot add a version to an archived track");
        }

        int nextVersion = trackVersionRepository.findMaxVersionNumberByTrackId(trackId) + 1;
        String folder = String.format(audioFolder, projectId, trackId);
        // The public id must be unique per upload attempt, not per version number:
        // with a shared "v{n}" id, a request losing the version-number race would
        // delete the asset the winning request just stored (Cloudinary returns the
        // existing asset instead of failing when overwrite=false).
        String publicId = "v" + nextVersion + "-" + UUID.randomUUID().toString().substring(0, 8);
        String audioUrl = cloudinaryService.upload(file, folder, publicId, "video", false);

        TrackVersion version = TrackVersion.builder()
                .track(track)
                .versionNumber(nextVersion)
                .audioUrl(audioUrl)
                .notes(notes)
                .label(label)
                .originalFileName(file.getOriginalFilename())
                .build();

        try {
            return trackVersionMapper.toResponse(trackVersionRepository.saveAndFlush(version));
        } catch (DataIntegrityViolationException e) {
            // Two concurrent uploads raced to the same version slot — clean up our own file.
            cloudinaryService.delete(folder + "/" + publicId, "video");
            throw new VersionConflictException("Version number conflict, please retry");
        }
    }

    @Transactional
    public TrackVersionResponse update(UUID projectId, UUID trackId, UUID versionId,
                                       UpdateTrackVersionRequest request, String email) {
        Track track = permissionService.checkTrackPermission(projectId, trackId, email, ProjectRole.COLLABORATOR);

        if (track.isArchived()) {
            throw new TrackAlreadyArchivedException("Cannot update a version of an archived track");
        }

        TrackVersion version = permissionService.resolveTrackVersion(trackId, versionId);

        if (request.label() != null) {
            version.setLabel(request.label().isBlank() ? null : request.label());
        }
        if (request.notes() != null) {
            version.setNotes(request.notes().isBlank() ? null : request.notes());
        }

        return trackVersionMapper.toResponse(trackVersionRepository.saveAndFlush(version));
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
            String detectedType = TIKA.detect(is);
            if (detectedType == null || !detectedType.startsWith("audio/")) {
                throw new FileValidationException("Only audio files are accepted");
            }
        } catch (IOException e) {
            throw new FileValidationException("Could not read uploaded file");
        }
    }

}
