package com.musicworkspace.backend.exception;

public class TrackVersionNotFoundException extends ResourceNotFoundException {
    public TrackVersionNotFoundException(String message) {
        super(message);
    }
}
