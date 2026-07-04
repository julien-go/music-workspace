package com.musicworkspace.backend.controller;

import com.musicworkspace.backend.dto.PublicProjectResponse;
import com.musicworkspace.backend.service.ProjectService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("/{id}")
    public ResponseEntity<PublicProjectResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.findPublic(id));
    }
}
