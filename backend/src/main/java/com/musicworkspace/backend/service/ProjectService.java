
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
    private final PermissionService permissionService;
    private final CloudinaryService cloudinaryService;

    @Value("${cloudinary.folder.cover}")
    private String coverFolder;

    @Transactional
    public ProjectResponse create(CreateProjectRequest request, String email) {
        User owner = permissionService.resolveUser(email);

        Project project = projectMapper.toEntity(request);
        project.setOwner(owner);
        Project saved = projectRepository.saveAndFlush(project);

        projectMemberRepository.save(ProjectMember.builder()
                .project(saved)
                .user(owner)
                .role(ProjectRole.OWNER)
                .build());

        return projectMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> findAll(String email) {
        User user = permissionService.resolveUser(email);
        return projectRepository.findAllByMembership(user.getId()).stream()
                .map(projectMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID id, String email) {
        Project project = permissionService.checkProjectPermission(id, email, ProjectRole.VIEWER);
        return projectMapper.toResponse(project);
    }

    @Transactional
    public ProjectResponse update(UUID id, UpdateProjectRequest request, String email) {
        Project project = permissionService.checkProjectPermission(id, email, ProjectRole.COLLABORATOR);

        if (request.name() != null) project.setName(request.name());
        if (request.description() != null) project.setDescription(request.description());

        return projectMapper.toResponse(project);
    }

    @Transactional
    public void delete(UUID id, String email) {
        Project project = permissionService.checkProjectPermission(id, email, ProjectRole.OWNER);
        projectRepository.delete(project);
    }

    @Transactional
    public ProjectResponse uploadCover(UUID id, MultipartFile file, String email) {
        Project project = permissionService.checkProjectPermission(id, email, ProjectRole.COLLABORATOR);

        String coverUrl = cloudinaryService.upload(
                file, String.format(coverFolder, id), "cover", "image", true);
        project.setCoverUrl(coverUrl);

        return projectMapper.toResponse(project);
    }
}
