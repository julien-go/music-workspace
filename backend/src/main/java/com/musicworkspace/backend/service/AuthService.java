package com.musicworkspace.backend.service;

import com.musicworkspace.backend.dto.AuthResponse;
import com.musicworkspace.backend.dto.LoginRequest;
import com.musicworkspace.backend.dto.RegisterRequest;
import com.musicworkspace.backend.dto.UserMapper;
import com.musicworkspace.backend.dto.UserResponse;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.EmailAlreadyExistsException;
import com.musicworkspace.backend.exception.UsernameAlreadyExistsException;
import com.musicworkspace.backend.repository.UserRepository;
import com.musicworkspace.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String EMAIL_UNIQUE_CONSTRAINT = "users_email_key";
    private static final String USERNAME_UNIQUE_CONSTRAINT = "users_username_key";

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException("Email already in use: " + request.email());
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException("Username already in use: " + request.username());
        }

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.password()));

        try {
            userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            throw mapConstraintViolation(ex, request);
        }

        return buildAuthResponse(user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        return buildAuthResponse(request.email());
    }

    public UserResponse getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return userMapper.toResponse(user);
    }

    private RuntimeException mapConstraintViolation(DataIntegrityViolationException ex, RegisterRequest request) {
        if (ex.getCause() instanceof ConstraintViolationException cve) {
            if (EMAIL_UNIQUE_CONSTRAINT.equals(cve.getConstraintName())) {
                return new EmailAlreadyExistsException("Email already in use: " + request.email());
            }
            if (USERNAME_UNIQUE_CONSTRAINT.equals(cve.getConstraintName())) {
                return new UsernameAlreadyExistsException("Username already in use: " + request.username());
            }
        }
        return ex;
    }

    private AuthResponse buildAuthResponse(String email) {
        String token = jwtService.generateToken(email);
        return new AuthResponse(token, "Bearer", jwtService.getExpirationMs());
    }
}
