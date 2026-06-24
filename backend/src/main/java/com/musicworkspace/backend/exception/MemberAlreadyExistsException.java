package com.musicworkspace.backend.exception;

public class MemberAlreadyExistsException extends ConflictException {
    public MemberAlreadyExistsException(String message) {
        super(message);
    }
}
