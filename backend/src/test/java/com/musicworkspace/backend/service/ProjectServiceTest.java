package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.musicworkspace.backend.dto.CreateProjectRequest;
import com.musicworkspace.backend.dto.ProjectMapper;
import com.musicworkspace.backend.dto.ProjectResponse;
import com.musicworkspace.backend.dto.UpdateProjectRequest;
import com.musicworkspace.backend.dto.UserSummary;
import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectMember;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.ProjectNotFoundException;
import com.musicworkspace.backend.repository.ProjectMemberRepository;
import com.musicworkspace.backend.repository.ProjectRepository;
import com.musicworkspace.backend.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Cloudinary cloudinary;

    @InjectMocks
    private ProjectService projectService;

    private Uploader mockUploader;

    private static final String EMAIL = "test@example.com";
    private User owner;
    private UUID projectId;
    private Project project;
    private ProjectResponse response;

    @BeforeEach
    void setUp() {
        mockUploader = org.mockito.Mockito.mock(Uploader.class);
        owner = User.builder().id(UUID.randomUUID()).email(EMAIL).username("testuser").build();
        projectId = UUID.randomUUID();
        project = Project.builder().id(projectId).owner(owner).name("My Album").build();
        response = new ProjectResponse(projectId, "My Album", null, null,
                new UserSummary(owner.getId(), "testuser"), Instant.now(), Instant.now());
    }

    @Test
    void create_savesProjectAndMemberAndReturnsResponse() {
        CreateProjectRequest request = new CreateProjectRequest("My Album", null);
        Project mapped = Project.builder().name("My Album").build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectMapper.toEntity(request)).thenReturn(mapped);
        when(projectRepository.save(mapped)).thenReturn(project);
        when(projectMapper.toResponse(project)).thenReturn(response);

        ProjectResponse result = projectService.create(request, EMAIL);

        assertThat(result).isEqualTo(response);
        assertThat(mapped.getOwner()).isEqualTo(owner);
        verify(projectMemberRepository).save(any(ProjectMember.class));
    }

    @Test
    void findAll_returnsMappedList() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectRepository.findByOwnerId(owner.getId())).thenReturn(List.of(project));
        when(projectMapper.toResponse(project)).thenReturn(response);

        List<ProjectResponse> result = projectService.findAll(EMAIL);

        assertThat(result).containsExactly(response);
    }

    @Test
    void findById_returnsProjectWhenOwner() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndOwnerId(projectId, owner.getId())).thenReturn(Optional.of(project));
        when(projectMapper.toResponse(project)).thenReturn(response);

        ProjectResponse result = projectService.findById(projectId, EMAIL);

        assertThat(result).isEqualTo(response);
    }

    @Test
    void findById_throwsNotFoundWhenNotOwner() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndOwnerId(projectId, owner.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.findById(projectId, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void update_updatesOnlyProvidedFields() {
        UpdateProjectRequest request = new UpdateProjectRequest("New Name", null);

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndOwnerId(projectId, owner.getId())).thenReturn(Optional.of(project));
        when(projectMapper.toResponse(project)).thenReturn(response);

        projectService.update(projectId, request, EMAIL);

        assertThat(project.getName()).isEqualTo("New Name");
        assertThat(project.getDescription()).isNull();
    }

    @Test
    void update_throwsNotFoundWhenNotOwner() {
        UpdateProjectRequest request = new UpdateProjectRequest("New Name", null);

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndOwnerId(projectId, owner.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.update(projectId, request, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }

    @Test
    void delete_deletesWhenOwner() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndOwnerId(projectId, owner.getId())).thenReturn(Optional.of(project));

        projectService.delete(projectId, EMAIL);

        verify(projectRepository).delete(project);
    }

    @Test
    void delete_throwsNotFoundWhenNotOwner() {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndOwnerId(projectId, owner.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.delete(projectId, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);

        verify(projectRepository, never()).delete(any());
    }

    @Test
    void uploadCover_uploadsToCloudinaryAndUpdatesCoverUrl() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", "image/jpeg", "img".getBytes());

        when(cloudinary.uploader()).thenReturn(mockUploader);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndOwnerId(projectId, owner.getId())).thenReturn(Optional.of(project));
        when(mockUploader.upload(any(byte[].class), any(Map.class)))
                .thenReturn(Map.of("secure_url", "https://res.cloudinary.com/cover.jpg"));
        when(projectMapper.toResponse(project)).thenReturn(response);

        ProjectResponse result = projectService.uploadCover(projectId, file, EMAIL);

        assertThat(result).isEqualTo(response);
        assertThat(project.getCoverUrl()).isEqualTo("https://res.cloudinary.com/cover.jpg");
    }

    @Test
    void uploadCover_throwsNotFoundWhenNotOwner() {
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", "image/jpeg", "img".getBytes());

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndOwnerId(projectId, owner.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.uploadCover(projectId, file, EMAIL))
                .isInstanceOf(ProjectNotFoundException.class);
    }
}
