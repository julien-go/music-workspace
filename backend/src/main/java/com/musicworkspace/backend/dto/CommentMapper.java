package com.musicworkspace.backend.dto;

import com.musicworkspace.backend.entity.ProjectComment;
import com.musicworkspace.backend.entity.TrackComment;
import com.musicworkspace.backend.entity.TrackVersionComment;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = UserSummaryMapper.class)
public interface CommentMapper {

    CommentResponse toResponse(ProjectComment comment);

    CommentResponse toResponse(TrackComment comment);

    CommentResponse toResponse(TrackVersionComment comment);
}
