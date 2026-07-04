package com.musicworkspace.backend.controller;

import com.musicworkspace.backend.config.AuthRateLimiter;
import com.musicworkspace.backend.dto.PublicProjectResponse;
import com.musicworkspace.backend.service.ProjectService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/projects")
@RequiredArgsConstructor
public class PublicProjectController {

    private final ProjectService projectService;
    private final AuthRateLimiter authRateLimiter;

    @GetMapping("/{id}")
    public ResponseEntity<PublicProjectResponse> getById(@PathVariable UUID id, HttpServletRequest request) {
        authRateLimiter.checkPublicProject(request);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic())
                .body(projectService.findPublic(id));
    }
}
