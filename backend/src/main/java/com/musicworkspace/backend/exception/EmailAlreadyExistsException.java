package com.musicworkspace.backend.exception;

public class EmailAlreadyExistsException extends ConflictException {

    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}
