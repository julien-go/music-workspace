package com.musicworkspace.backend.exception;

public class UsernameAlreadyExistsException extends ConflictException {

    public UsernameAlreadyExistsException(String message) {
        super(message);
    }
}
