package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.ProjectMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = UserSummaryMapper.class)
public interface ProjectMemberMapper {

    @Mapping(source = "user", target = "user")
    ProjectMemberResponse toResponse(ProjectMember member);
}
