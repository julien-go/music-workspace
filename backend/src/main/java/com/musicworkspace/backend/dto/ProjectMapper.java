package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.ProjectRole;
import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = UserSummaryMapper.class)
public interface ProjectMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "coverUrl", ignore = true)
    // Builder target: the isPublic field keeps its name on Project.ProjectBuilder.
    @Mapping(target = "isPublic", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Project toEntity(CreateProjectRequest request);

    // Lombok exposes the isPublic field as bean property "public".
    @Mapping(source = "project.owner", target = "owner")
    @Mapping(source = "project.public", target = "isPublic")
    @Mapping(source = "role", target = "currentUserRole")
    ProjectResponse toResponse(Project project, ProjectRole role);

    @Mapping(source = "project.owner.username", target = "owner")
    PublicProjectResponse toPublicResponse(Project project, List<PublicProjectResponse.PublicTrackResponse> tracks);
}
