package com.musicworkspace.backend.exception;

public class TrackAlreadyArchivedException extends ConflictException {
    public TrackAlreadyArchivedException(String message) {
        super(message);
    }
}
