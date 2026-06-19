package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.TrackVersion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TrackVersionMapper {

    @Mapping(source = "track.id", target = "trackId")
    TrackVersionResponse toResponse(TrackVersion version);
}
