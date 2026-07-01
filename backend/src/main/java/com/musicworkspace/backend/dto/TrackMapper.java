package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.Track;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TrackMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "project", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "archived", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Track toEntity(CreateTrackRequest request);

    @Mapping(source = "track.id", target = "id")
    @Mapping(source = "track.position", target = "position")
    @Mapping(source = "track.name", target = "name")
    @Mapping(source = "track.description", target = "description")
    @Mapping(source = "track.status", target = "status")
    @Mapping(source = "track.archived", target = "archived")
    @Mapping(source = "track.createdAt", target = "createdAt")
    @Mapping(source = "track.updatedAt", target = "updatedAt")
    TrackResponse toResponse(Track track, int versionCount, String lastVersionNote, CommentResponse lastComment);
}
