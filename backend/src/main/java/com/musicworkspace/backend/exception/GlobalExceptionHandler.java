package com.musicworkspace.backend.exception;

import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        return buildResponse(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), List.of());
    }

    @ExceptionHandler(UsernameAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUsernameAlreadyExists(UsernameAlreadyExistsException ex) {
        return buildResponse(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();
        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "Validation failed", errors);
    }

    @ExceptionHandler(ProjectNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProjectNotFound(ProjectNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), List.of());
    }

    @ExceptionHandler(TrackNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTrackNotFound(TrackNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), List.of());
    }

    @ExceptionHandler(TrackAlreadyArchivedException.class)
    public ResponseEntity<ErrorResponse> handleTrackAlreadyArchived(TrackAlreadyArchivedException ex) {
        return buildResponse(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), List.of());
    }

    @ExceptionHandler(TrackVersionNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleTrackVersionNotFound(TrackVersionNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), List.of());
    }

    @ExceptionHandler(VersionConflictException.class)
    public ResponseEntity<ErrorResponse> handleVersionConflict(VersionConflictException ex) {
        return buildResponse(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), List.of());
    }

    @ExceptionHandler(CloudinaryUploadException.class)
    public ResponseEntity<ErrorResponse> handleCloudinaryUpload(CloudinaryUploadException ex) {
        log.error("Cloudinary upload failed", ex);
        return buildResponse(HttpStatus.BAD_GATEWAY, "BAD_GATEWAY", ex.getMessage(), List.of());
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUsernameNotFound(UsernameNotFoundException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Authentication required", List.of());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Invalid email or password", List.of());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        return buildResponse(status, status.name(), ex.getReason(), List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Unexpected error", ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", List.of());
    }

    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String error, String message, List<String> errors) {
        return ResponseEntity.status(status).body(new ErrorResponse(status.value(), error, message, errors));
    }
}
