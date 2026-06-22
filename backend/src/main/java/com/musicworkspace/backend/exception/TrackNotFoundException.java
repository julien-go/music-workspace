package com.musicworkspace.backend.exception;

public class TrackNotFoundException extends ResourceNotFoundException {
    public TrackNotFoundException(String message) {
        super(message);
    }
}
