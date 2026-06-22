package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserSummaryMapper {

    UserSummary toUserSummary(User user);
}
