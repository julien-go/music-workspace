
package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.CreateProjectRequest;
import com.musicworkspace.backend.dto.ProjectMapper;
import com.musicworkspace.backend.dto.ProjectResponse;
import com.musicworkspace.backend.dto.UpdateProjectRequest;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.FileValidationException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.ProjectRepository;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
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

    private static final long MAX_COVER_SIZE = 5 * 1024 * 1024;
    private static final Tika TIKA = new Tika();

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

        return projectMapper.toResponse(saved, ProjectRole.OWNER);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> findAll(String email) {
        User user = permissionService.resolveUser(email);
        return projectMemberRepository.findByUserId(user.getId()).stream()
                .map(pm -> projectMapper.toResponse(pm.getProject(), pm.getRole()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID id, String email) {
        ProjectMember member = permissionService.resolveMembership(id, email, ProjectRole.VIEWER);
        return projectMapper.toResponse(member.getProject(), member.getRole());
    }

    @Transactional
    public ProjectResponse update(UUID id, UpdateProjectRequest request, String email) {
        ProjectMember member = permissionService.resolveMembership(id, email, ProjectRole.COLLABORATOR);
        Project project = member.getProject();

        if (request.name() != null) project.setName(request.name());
        if (request.description() != null) project.setDescription(request.description());

        return projectMapper.toResponse(project, member.getRole());
    }

    @Transactional
    public void delete(UUID id, String email) {
        permissionService.checkProjectPermission(id, email, ProjectRole.OWNER);
        projectRepository.deleteProjectById(id);
    }

    @Transactional
    public ProjectResponse uploadCover(UUID id, MultipartFile file, String email) {
        ProjectMember member = permissionService.resolveMembership(id, email, ProjectRole.COLLABORATOR);
        validateImageFile(file);
        Project project = member.getProject();

        String coverUrl = cloudinaryService.upload(
                file, String.format(coverFolder, id), "cover", "image", true);
        project.setCoverUrl(coverUrl);

        return projectMapper.toResponse(project, member.getRole());
    }

    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileValidationException("File must not be empty");
        }
        if (file.getSize() > MAX_COVER_SIZE) {
            throw new FileValidationException("File size must not exceed 5MB");
        }
        try (InputStream is = file.getInputStream()) {
            String detectedType = TIKA.detect(is);
            if (detectedType == null || !detectedType.startsWith("image/")) {
                throw new FileValidationException("Only image files are accepted");
            }
        } catch (IOException e) {
            throw new FileValidationException("Could not read uploaded file");
        }
    }
}
