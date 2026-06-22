package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.Task;
import com.musicworkspace.backend.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TaskMapper {

    @Mapping(source = "project.id", target = "projectId")
    @Mapping(source = "createdBy", target = "createdBy")
    @Mapping(source = "assignedTo", target = "assignedTo")
    TaskResponse toResponse(Task task);

    UserSummary toUserSummary(User user);
}
