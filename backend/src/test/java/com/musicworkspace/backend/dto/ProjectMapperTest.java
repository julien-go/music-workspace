package com.musicworkspace.backend.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectRole;
import com.musicworkspace.backend.entity.User;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

class ProjectMapperTest {

    private final ProjectMapper mapper = createMapper();

    private static ProjectMapper createMapper() {
        ProjectMapper m = Mappers.getMapper(ProjectMapper.class);
        ReflectionTestUtils.setField(m, "userSummaryMapper", Mappers.getMapper(UserSummaryMapper.class));
        return m;
    }

    @Test
    void toResponse_mapsOwnerAndRole() {
        User owner = User.builder()
                .id(UUID.randomUUID())
                .username("alice")
                .email("alice@example.com")
                .build();
        Project project = Project.builder()
                .id(UUID.randomUUID())
                .name("My Album")
                .description("desc")
                .coverUrl("https://example.com/cover.jpg")
                .owner(owner)
                .build();

        ProjectResponse response = mapper.toResponse(project, ProjectRole.COLLABORATOR);

        assertThat(response.id()).isEqualTo(project.getId());
        assertThat(response.name()).isEqualTo("My Album");
        assertThat(response.coverUrl()).isEqualTo("https://example.com/cover.jpg");
        assertThat(response.owner()).isNotNull();
        assertThat(response.owner().id()).isEqualTo(owner.getId());
        assertThat(response.owner().username()).isEqualTo("alice");
        assertThat(response.currentUserRole()).isEqualTo(ProjectRole.COLLABORATOR);
    }

    @Test
    void toResponse_handlesNullOwnerAndNullRole() {
        Project project = Project.builder()
                .id(UUID.randomUUID())
                .name("No Owner")
                .build();

        ProjectResponse response = mapper.toResponse(project, null);

        assertThat(response.owner()).isNull();
        assertThat(response.currentUserRole()).isNull();
    }
}
