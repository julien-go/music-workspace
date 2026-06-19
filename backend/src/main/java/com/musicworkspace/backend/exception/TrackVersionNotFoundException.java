package com.musicworkspace.backend.exception;

public class TrackVersionNotFoundException extends RuntimeException {
    public TrackVersionNotFoundException(String message) {
        super(message);
    }
}
