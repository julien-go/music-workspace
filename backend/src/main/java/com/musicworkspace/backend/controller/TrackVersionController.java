package com.musicworkspace.backend.controller;

import com.musicworkspace.backend.dto.TrackVersionResponse;
import com.musicworkspace.backend.service.TrackVersionService;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/tracks/{trackId}/versions")
@RequiredArgsConstructor
public class TrackVersionController {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final Tika TIKA = new Tika();

    private final TrackVersionService trackVersionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TrackVersionResponse> create(
            @PathVariable UUID projectId,
            @PathVariable UUID trackId,
            @RequestParam(required = false) String notes,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        validateAudioFile(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(trackVersionService.create(projectId, trackId, notes, file, authentication.getName()));
    }

    private void validateAudioFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "File must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "File size must not exceed 10MB");
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

    @GetMapping
    public ResponseEntity<List<TrackVersionResponse>> list(
            @PathVariable UUID projectId,
            @PathVariable UUID trackId,
            Authentication authentication) {
        return ResponseEntity.ok(trackVersionService.findAll(projectId, trackId, authentication.getName()));
    }

    @GetMapping("/{versionId}")
    public ResponseEntity<TrackVersionResponse> getById(
            @PathVariable UUID projectId,
            @PathVariable UUID trackId,
            @PathVariable UUID versionId,
            Authentication authentication) {
        return ResponseEntity.ok(trackVersionService.findById(projectId, trackId, versionId, authentication.getName()));
    }
}
