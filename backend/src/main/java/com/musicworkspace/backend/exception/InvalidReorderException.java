package com.musicworkspace.backend.exception;

public class InvalidReorderException extends RuntimeException {
    public InvalidReorderException(String message) {
        super(message);
    }
}
