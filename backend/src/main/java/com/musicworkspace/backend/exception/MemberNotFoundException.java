package com.musicworkspace.backend.exception;

public class MemberNotFoundException extends ResourceNotFoundException {
    public MemberNotFoundException(String message) {
        super(message);
    }
}
