
package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CreateProjectRequest;
import com.musicworkspace.backend.dto.ProjectMapper;
import com.musicworkspace.backend.dto.ProjectResponse;
import com.musicworkspace.backend.dto.UpdateProjectRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.ProjectRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectMapper projectMapper;
    private final ProjectAccessService projectAccessService;
    private final CloudinaryService cloudinaryService;

    @Value("${cloudinary.folder.cover}")
    private String coverFolder;

    @Transactional
    public ProjectResponse create(CreateProjectRequest request, String email) {
        User owner = projectAccessService.resolveUser(email);

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
        User owner = projectAccessService.resolveUser(email);
        return projectRepository.findByOwnerId(owner.getId()).stream()
                .map(projectMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID id, String email) {
        User owner = projectAccessService.resolveUser(email);
        return projectMapper.toResponse(projectAccessService.resolveOwnedProject(id, owner.getId()));
    }

    @Transactional
    public ProjectResponse update(UUID id, UpdateProjectRequest request, String email) {
        User owner = projectAccessService.resolveUser(email);
        Project project = projectAccessService.resolveOwnedProject(id, owner.getId());

        if (request.name() != null) project.setName(request.name());
        if (request.description() != null) project.setDescription(request.description());

        return projectMapper.toResponse(project);
    }

    @Transactional
    public void delete(UUID id, String email) {
        User owner = projectAccessService.resolveUser(email);
        projectRepository.delete(projectAccessService.resolveOwnedProject(id, owner.getId()));
    }

    @Transactional
    public ProjectResponse uploadCover(UUID id, MultipartFile file, String email) {
        User owner = projectAccessService.resolveUser(email);
        Project project = projectAccessService.resolveOwnedProject(id, owner.getId());

        String coverUrl = cloudinaryService.upload(
                file, String.format(coverFolder, id), "cover", "image", true);
        project.setCoverUrl(coverUrl);

        return projectMapper.toResponse(project);
    }
}
