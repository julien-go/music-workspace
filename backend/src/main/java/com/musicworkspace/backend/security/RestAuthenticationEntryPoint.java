package com.musicworkspace.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicworkspace.backend.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

/**
 * Without an explicit entry point, Spring Security falls back to
 * Http403ForbiddenEntryPoint (no httpBasic/formLogin is enabled here), so a
 * missing or expired JWT would yield a 403 with an empty body instead of the
 * documented 401 JSON — which the frontend relies on to redirect to /login.
 */
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(), "UNAUTHORIZED", "Authentication required", List.of()));
    }
}
