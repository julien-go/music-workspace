package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.Project;
import com.musicworkspace.backend.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProjectMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "coverUrl", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Project toEntity(CreateProjectRequest request);

    @Mapping(source = "owner", target = "owner")
    ProjectResponse toResponse(Project project);

    UserSummary toUserSummary(User user);
}
