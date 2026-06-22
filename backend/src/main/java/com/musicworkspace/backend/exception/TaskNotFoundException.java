package com.musicworkspace.backend.exception;

public class TaskNotFoundException extends ResourceNotFoundException {
    public TaskNotFoundException(String message) {
        super(message);
    }
}
