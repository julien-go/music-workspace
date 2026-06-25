package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.dto.AuthResponse.AuthUser;
import com.musicworkspace.backend.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    User toEntity(RegisterRequest request);

    UserResponse toResponse(User user);

    AuthUser toAuthUser(User user);
}
