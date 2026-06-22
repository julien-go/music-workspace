package com.musicworkspace.backend.exception;

public class ProjectNotFoundException extends ResourceNotFoundException {

    public ProjectNotFoundException(String message) {
        super(message);
    }
}
