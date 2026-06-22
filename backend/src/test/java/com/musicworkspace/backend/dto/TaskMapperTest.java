package com.musicworkspace.backend.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.Task;
import com.musicworkspace.backend.entity.TaskStatus;
import com.musicworkspace.backend.entity.User;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

class TaskMapperTest {

    private final TaskMapper mapper = Mappers.getMapper(TaskMapper.class);

    @Test
    void toResponse_mapsProjectIdAndUsers() {
        User creator = User.builder().id(UUID.randomUUID()).username("alice").build();
        User assignee = User.builder().id(UUID.randomUUID()).username("bob").build();
        Project project = Project.builder().id(UUID.randomUUID()).build();

        Task task = Task.builder()
                .id(UUID.randomUUID())
                .title("Record guitar")
                .description("Track 3")
                .status(TaskStatus.DOING)
                .project(project)
                .createdBy(creator)
                .assignedTo(assignee)
                .build();

        TaskResponse response = mapper.toResponse(task);

        assertThat(response.projectId()).isEqualTo(project.getId());
        assertThat(response.title()).isEqualTo("Record guitar");
        assertThat(response.status()).isEqualTo(TaskStatus.DOING);
        assertThat(response.createdBy().id()).isEqualTo(creator.getId());
        assertThat(response.createdBy().username()).isEqualTo("alice");
        assertThat(response.assignedTo().id()).isEqualTo(assignee.getId());
        assertThat(response.assignedTo().username()).isEqualTo("bob");
    }

    @Test
    void toResponse_handlesNullAssignedTo() {
        User creator = User.builder().id(UUID.randomUUID()).username("alice").build();
        Project project = Project.builder().id(UUID.randomUUID()).build();

        Task task = Task.builder()
                .id(UUID.randomUUID())
                .title("Unassigned")
                .status(TaskStatus.TODO)
                .project(project)
                .createdBy(creator)
                .build();

        TaskResponse response = mapper.toResponse(task);

        assertThat(response.assignedTo()).isNull();
        assertThat(response.createdBy()).isNotNull();
    }
}
