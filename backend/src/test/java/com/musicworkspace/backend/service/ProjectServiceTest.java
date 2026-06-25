package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.dto.CreateProjectRequest;
import com.musicworkspace.backend.dto.ProjectMapper;
import com.musicworkspace.backend.dto.ProjectResponse;
import com.musicworkspace.backend.dto.UpdateProjectRequest;
import com.musicworkspace.backend.dto.UserSummary;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.FileValidationException;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.ProjectRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private PermissionService permissionService;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private ProjectService projectService;

    private static final String EMAIL = "test@example.com";
    private User owner;
    private UUID projectId;
    private Project project;
    private ProjectResponse response;
    private ProjectMember ownerMember;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(projectService, "coverFolder", "music-workspace/projects/%s/cover");
        owner = User.builder().id(UUID.randomUUID()).email(EMAIL).username("testuser").build();
        projectId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(owner).name("My Album").build();
        response = new ProjectResponse(projectId, "My Album", null, null,
                new UserSummary(owner.getId(), "testuser"),
                ProjectRole.OWNER, Instant.now(), Instant.now());
        ownerMember = ProjectMember.builder()
                .project(project).user(owner).role(ProjectRole.OWNER).build();
    }

    @Test
    void create_savesProjectAndMemberAndReturnsResponse() {
        CreateProjectRequest request = new CreateProjectRequest("My Album", null);
        Project mapped = Project.builder().name("My Album").build();

        when(permissionService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectMapper.toEntity(request)).thenReturn(mapped);
        when(projectRepository.saveAndFlush(mapped)).thenReturn(project);
        when(projectMapper.toResponse(project, ProjectRole.OWNER)).thenReturn(response);

        ProjectResponse result = projectService.create(request, EMAIL);

        assertThat(result).isEqualTo(response);
        assertThat(result.currentUserRole()).isEqualTo(ProjectRole.OWNER);
        assertThat(mapped.getOwner()).isEqualTo(owner);
        verify(projectMemberRepository).save(any(ProjectMember.class));
    }

    @Test
    void findAll_returnsMappedListWithRoles() {
        ProjectMember membership = ProjectMember.builder()
                .project(project).user(owner).role(ProjectRole.OWNER).build();

        when(permissionService.resolveUser(EMAIL)).thenReturn(owner);
        when(projectMemberRepository.findByUserId(owner.getId())).thenReturn(List.of(membership));
        when(projectMapper.toResponse(project, ProjectRole.OWNER)).thenReturn(response);

        List<ProjectResponse> result = projectService.findAll(EMAIL);

        assertThat(result).containsExactly(response);
    }

    @Test
    void findById_returnsProjectWithRole() {
        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER))
                .thenReturn(ownerMember);
        when(projectMapper.toResponse(project, ProjectRole.OWNER)).thenReturn(response);

        ProjectResponse result = projectService.findById(projectId, EMAIL);

        assertThat(result).isEqualTo(response);
    }

    @Test
    void findById_throwsNotFoundWhenNotMember() {
        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.VIEWER))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> projectService.findById(projectId, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void update_updatesOnlyProvidedFields() {
        UpdateProjectRequest request = new UpdateProjectRequest("New Name", null);
        ProjectMember collaboratorMember = ProjectMember.builder()
                .project(project).user(owner).role(ProjectRole.COLLABORATOR).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.COLLABORATOR))
                .thenReturn(collaboratorMember);
        when(projectMapper.toResponse(project, ProjectRole.COLLABORATOR)).thenReturn(response);

        projectService.update(projectId, request, EMAIL);

        assertThat(project.getName()).isEqualTo("New Name");
        assertThat(project.getDescription()).isNull();
    }

    @Test
    void update_throwsNotFoundWhenNotMember() {
        UpdateProjectRequest request = new UpdateProjectRequest("New Name", null);

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.COLLABORATOR))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> projectService.update(projectId, request, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void delete_deletesWhenOwner() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.OWNER)).thenReturn(project);

        projectService.delete(projectId, EMAIL);

        verify(projectRepository).delete(project);
    }

    @Test
    void delete_throwsNotFoundWhenNotOwner() {
        when(permissionService.checkProjectPermission(projectId, EMAIL, ProjectRole.OWNER))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> projectService.delete(projectId, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);

        verify(projectRepository, never()).delete(any());
    }

    @Test
    void uploadCover_uploadsToCloudinaryAndUpdatesCoverUrl() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "cover.png", "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});
        ProjectMember collaboratorMember = ProjectMember.builder()
                .project(project).user(owner).role(ProjectRole.COLLABORATOR).build();

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.COLLABORATOR))
                .thenReturn(collaboratorMember);
        when(cloudinaryService.upload(any(), any(), any(), any(), any(Boolean.class)))
                .thenReturn("https://res.cloudinary.com/cover.jpg");
        when(projectMapper.toResponse(project, ProjectRole.COLLABORATOR)).thenReturn(response);

        ProjectResponse result = projectService.uploadCover(projectId, file, EMAIL);

        assertThat(result).isEqualTo(response);
        assertThat(project.getCoverUrl()).isEqualTo("https://res.cloudinary.com/cover.jpg");
    }

    @Test
    void uploadCover_throwsNotFoundWhenNotMember() {
        MockMultipartFile file = new MockMultipartFile("file", "cover.png", "image/png",
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});

        when(permissionService.resolveMembership(projectId, EMAIL, ProjectRole.COLLABORATOR))
                .thenThrow(new ProjectNotFoundException("Project not found"));

        assertThatThrownBy(() -> projectService.uploadCover(projectId, file, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void uploadCover_throwsWhenFileIsEmpty() {
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> projectService.uploadCover(projectId, file, EMAIL))
                .isInstanceOf(FileValidationException.class)
                .hasMessageContaining("File must not be empty");
    }

    @Test
    void uploadCover_throwsWhenFileTooLarge() {
        byte[] largeContent = new byte[6 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", "image/jpeg", largeContent);

        assertThatThrownBy(() -> projectService.uploadCover(projectId, file, EMAIL))
                .isInstanceOf(FileValidationException.class)
                .hasMessageContaining("File size must not exceed 5MB");
    }

    @Test
    void uploadCover_throwsWhenFileIsNotImage() {
        MockMultipartFile file = new MockMultipartFile("file", "track.mp3", "audio/mpeg",
                new byte[]{(byte) 0xFF, (byte) 0xFB, (byte) 0x90, 0x00});

        assertThatThrownBy(() -> projectService.uploadCover(projectId, file, EMAIL))
                .isInstanceOf(FileValidationException.class)
                .hasMessageContaining("Only image files are accepted");
    }
}
