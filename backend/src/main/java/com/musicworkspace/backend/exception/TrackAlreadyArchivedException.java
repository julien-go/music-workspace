package com.musicworkspace.backend.exception;

public class TrackAlreadyArchivedException extends RuntimeException {
    public TrackAlreadyArchivedException(String message) {
        super(message);
    }
}
