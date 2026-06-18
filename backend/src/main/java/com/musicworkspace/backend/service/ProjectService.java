
package com.musicworkspace.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.musicworkspace.backend.dto.CreateProjectRequest;
import com.musicworkspace.backend.dto.ProjectMapper;
import com.musicworkspace.backend.dto.ProjectResponse;
import com.musicworkspace.backend.dto.UpdateProjectRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.ProjectRepository;
import com.musicworkspace.backend.repository.UserRepository;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectMapper projectMapper;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    @Transactional
    public ProjectResponse create(CreateProjectRequest request, String email) {
        User owner = resolveUser(email);

        Project project = projectMapper.toEntity(request);
        project.setOwner(owner);
        Project saved = projectRepository.save(project);

        projectMemberRepository.save(ProjectMember.builder()
                .project(saved)
                .user(owner)
                .role(ProjectRole.OWNER)
                .build());

        return projectMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> findAll(String email) {
        User owner = resolveUser(email);
        return projectRepository.findByOwnerId(owner.getId()).stream()
                .map(projectMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID id, String email) {
        User owner = resolveUser(email);
        return projectMapper.toResponse(resolveOwnedProject(id, owner.getId()));
    }

    @Transactional
    public ProjectResponse update(UUID id, UpdateProjectRequest request, String email) {
        User owner = resolveUser(email);
        Project project = resolveOwnedProject(id, owner.getId());

        if (request.name() != null) project.setName(request.name());
        if (request.description() != null) project.setDescription(request.description());

        return projectMapper.toResponse(project);
    }

    @Transactional
    public void delete(UUID id, String email) {
        User owner = resolveUser(email);
        projectRepository.delete(resolveOwnedProject(id, owner.getId()));
    }

    @Transactional
    public ProjectResponse uploadCover(UUID id, MultipartFile file, String email) {
        User owner = resolveUser(email);
        Project project = resolveOwnedProject(id, owner.getId());

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "music-workspace/covers",
                            "public_id", "project-cover-" + id,
                            "overwrite", true,
                            "resource_type", "image"
                    )
            );
            project.setCoverUrl((String) result.get("secure_url"));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload cover image", e);
        }

        return projectMapper.toResponse(project);
    }

    private Project resolveOwnedProject(UUID id, UUID ownerId) {
        return projectRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found"));
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}
