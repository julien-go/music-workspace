package com.musicworkspace.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.musicworkspace.backend.dto.AuthResponse.AuthUser;
import com.musicworkspace.backend.dto.LoginRequest;
import com.musicworkspace.backend.dto.RegisterRequest;
import com.musicworkspace.backend.dto.UserMapper;
import com.musicworkspace.backend.dto.UserResponse;
import com.musicworkspace.backend.security.CustomUserDetails;
import com.musicworkspace.backend.entity.User;
import com.musicworkspace.backend.exception.EmailAlreadyExistsException;
import com.musicworkspace.backend.exception.UsernameAlreadyExistsException;
import com.musicworkspace.backend.repository.UserRepository;
import com.musicworkspace.backend.security.JwtService;
import com.musicworkspace.backend.service.AuthService.AuthResult;
import java.sql.SQLException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtService jwtService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest("test@example.com", "testuser", "password123");
        loginRequest = new LoginRequest("test@example.com", "password123");
    }

    @Test
    void register_savesUserAndReturnsAuthResult() {
        UUID userId = UUID.randomUUID();
        User mappedUser = User.builder()
                .id(userId)
                .email(registerRequest.email())
                .username(registerRequest.username())
                .build();

        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(false);
        when(userRepository.existsByUsername(registerRequest.username())).thenReturn(false);
        when(userMapper.toEntity(registerRequest)).thenReturn(mappedUser);
        when(passwordEncoder.encode(registerRequest.password())).thenReturn("hashed-password");
        when(jwtService.generateToken(registerRequest.email())).thenReturn("jwt-token");
        when(userMapper.toAuthUser(mappedUser)).thenReturn(new AuthUser(userId, "test@example.com", "testuser"));

        AuthResult result = authService.register(registerRequest);

        assertThat(result.token()).isEqualTo("jwt-token");
        assertThat(result.response().user().id()).isEqualTo(userId);
        assertThat(result.response().user().email()).isEqualTo("test@example.com");
        assertThat(result.response().user().username()).isEqualTo("testuser");
        assertThat(mappedUser.getPassword()).isEqualTo("hashed-password");
        verify(userRepository).save(mappedUser);
    }

    @Test
    void register_throwsWhenEmailAlreadyExists() {
        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(EmailAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_throwsWhenUsernameAlreadyExists() {
        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(false);
        when(userRepository.existsByUsername(registerRequest.username())).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(UsernameAlreadyExistsException.class);

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_returnsAuthResult() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email(loginRequest.email())
                .username("testuser")
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authToken);
        when(jwtService.generateToken(loginRequest.email())).thenReturn("jwt-token");
        when(userMapper.toAuthUser(user)).thenReturn(new AuthUser(userId, "test@example.com", "testuser"));

        AuthResult result = authService.login(loginRequest);

        assertThat(result.token()).isEqualTo("jwt-token");
        assertThat(result.response().user().id()).isEqualTo(userId);
        assertThat(result.response().user().email()).isEqualTo("test@example.com");
        assertThat(result.response().user().username()).isEqualTo("testuser");
    }

    @Test
    void login_propagatesBadCredentials() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class);

        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void register_mapsEmailUniqueConstraintViolationToEmailAlreadyExists() {
        User mappedUser = User.builder()
                .email(registerRequest.email())
                .username(registerRequest.username())
                .build();

        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(false);
        when(userRepository.existsByUsername(registerRequest.username())).thenReturn(false);
        when(userMapper.toEntity(registerRequest)).thenReturn(mappedUser);
        when(passwordEncoder.encode(registerRequest.password())).thenReturn("hashed-password");
        when(userRepository.save(mappedUser)).thenThrow(constraintViolation("users_email_key"));

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(EmailAlreadyExistsException.class);
    }

    @Test
    void register_mapsUsernameUniqueConstraintViolationToUsernameAlreadyExists() {
        User mappedUser = User.builder()
                .email(registerRequest.email())
                .username(registerRequest.username())
                .build();

        when(userRepository.existsByEmail(registerRequest.email())).thenReturn(false);
        when(userRepository.existsByUsername(registerRequest.username())).thenReturn(false);
        when(userMapper.toEntity(registerRequest)).thenReturn(mappedUser);
        when(passwordEncoder.encode(registerRequest.password())).thenReturn("hashed-password");
        when(userRepository.save(mappedUser)).thenThrow(constraintViolation("users_username_key"));

        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(UsernameAlreadyExistsException.class);
    }

    @Test
    void getCurrentUser_returnsMappedUserResponse() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(registerRequest.email())
                .username(registerRequest.username())
                .createdAt(Instant.now())
                .build();
        UserResponse expectedResponse = new UserResponse(user.getId(), user.getEmail(), user.getUsername(), user.getCreatedAt());

        when(authentication.getName()).thenReturn(user.getEmail());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(userMapper.toResponse(user)).thenReturn(expectedResponse);

        UserResponse response = authService.getCurrentUser(authentication);

        assertThat(response).isEqualTo(expectedResponse);
    }

    private static DataIntegrityViolationException constraintViolation(String constraintName) {
        return new DataIntegrityViolationException("could not execute statement",
                new ConstraintViolationException("duplicate key value violates unique constraint",
                        new SQLException("duplicate key value"), constraintName));
    }
}
