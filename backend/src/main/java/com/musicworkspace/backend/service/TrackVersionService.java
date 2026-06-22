package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.TrackVersionMapper;
import com.musicworkspace.backend.dto.TrackVersionResponse;
import com.musicworkspace.backend.entity.Track;
import com.musicworkspace.backend.entity.TrackVersion;
import com.musicworkspace.backend.entity.User;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class TrackVersionService {

    private final TrackVersionRepository trackVersionRepository;
    private final TrackVersionMapper trackVersionMapper;
    private final ProjectAccessService projectAccessService;
    private final CloudinaryService cloudinaryService;

    private static final long MAX_FILE_SIZE = 70 * 1024 * 1024;
    private static final Tika TIKA = new Tika();

    @Value("${cloudinary.folder.audio}")
    private String audioFolder;

    @Transactional
    public TrackVersionResponse create(UUID projectId, UUID trackId, String notes, MultipartFile file, String email) {
        validateAudioFile(file);
        User owner = projectAccessService.resolveUser(email);
        Track track = projectAccessService.resolveTrack(trackId, projectId, owner.getId());

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
        User owner = projectAccessService.resolveUser(email);
        projectAccessService.resolveTrack(trackId, projectId, owner.getId());
        return trackVersionRepository.findByTrackId(trackId).stream()
                .map(trackVersionMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrackVersionResponse findById(UUID projectId, UUID trackId, UUID versionId, String email) {
        User owner = projectAccessService.resolveUser(email);
        projectAccessService.resolveTrack(trackId, projectId, owner.getId());
        return trackVersionMapper.toResponse(
                trackVersionRepository.findByIdAndTrackId(versionId, trackId)
                        .orElseThrow(() -> new TrackVersionNotFoundException("Track version not found"))
        );
    }

    private void validateAudioFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "File must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "File size must not exceed 70MB");
        }
        try (InputStream is = file.getInputStream()) {
            String detectedType = TIKA.detect(is, file.getOriginalFilename());
            if (detectedType == null || !detectedType.startsWith("audio/")) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Only audio files are accepted");
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Could not read uploaded file");
        }
    }

    private String uploadAudio(MultipartFile file, UUID projectId, UUID trackId, int versionNumber) {
        return cloudinaryService.upload(
                file, String.format(audioFolder, projectId, trackId),
                "v" + versionNumber, "video", false);
    }
}
