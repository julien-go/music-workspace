package com.musicworkspace.backend.exception;

public class VersionConflictException extends ConflictException {
    public VersionConflictException(String message) {
        super(message);
    }
}
