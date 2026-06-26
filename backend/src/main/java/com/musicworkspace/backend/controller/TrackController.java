package com.musicworkspace.backend.controller;

import com.musicworkspace.backend.dto.CreateTrackRequest;
import com.musicworkspace.backend.dto.TrackResponse;
import com.musicworkspace.backend.dto.UpdateTrackRequest;
import com.musicworkspace.backend.service.TrackService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/tracks")
@RequiredArgsConstructor
public class TrackController {

    private final TrackService trackService;

    @PostMapping
    public ResponseEntity<TrackResponse> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTrackRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(trackService.create(projectId, request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<TrackResponse>> list(
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "false") boolean archived,
            Authentication authentication) {
        return ResponseEntity.ok(trackService.findAll(projectId, authentication.getName(), archived));
    }

    @GetMapping("/{trackId}")
    public ResponseEntity<TrackResponse> getById(
            @PathVariable UUID projectId,
            @PathVariable UUID trackId,
            Authentication authentication) {
        return ResponseEntity.ok(trackService.findById(projectId, trackId, authentication.getName()));
    }

    @PatchMapping("/{trackId}")
    public ResponseEntity<TrackResponse> update(
            @PathVariable UUID projectId,
            @PathVariable UUID trackId,
            @Valid @RequestBody UpdateTrackRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(trackService.update(projectId, trackId, request, authentication.getName()));
    }

    @PatchMapping("/{trackId}/archive")
    public ResponseEntity<TrackResponse> archive(
            @PathVariable UUID projectId,
            @PathVariable UUID trackId,
            Authentication authentication) {
        return ResponseEntity.ok(trackService.archive(projectId, trackId, authentication.getName()));
    }

    @PatchMapping("/{trackId}/unarchive")
    public ResponseEntity<TrackResponse> unarchive(
            @PathVariable UUID projectId,
            @PathVariable UUID trackId,
            Authentication authentication) {
        return ResponseEntity.ok(trackService.unarchive(projectId, trackId, authentication.getName()));
    }
}
