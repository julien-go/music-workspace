package com.musicworkspace.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.musicworkspace.backend.exception.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * CSRF defense for the cross-site prod deployment (SameSite=None cookie):
 * state-changing requests must come from the configured frontend origin or
 * from the API's own origin (Swagger UI). This closes the gap CORS leaves
 * open — "simple" requests like multipart POSTs are sent without preflight,
 * cookie included. Requests without an Origin header pass: non-browser
 * clients don't carry the victim's cookie, and browsers always send Origin
 * on cross-site mutations.
 */
@Component
public class OriginValidationFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    private final String allowedOrigin;
    private final ObjectMapper objectMapper;

    public OriginValidationFilter(@Value("${app.cors.allowed-origin}") String allowedOrigin,
                                  ObjectMapper objectMapper) {
        this.allowedOrigin = stripTrailingSlash(allowedOrigin);
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String origin = request.getHeader("Origin");

        if (SAFE_METHODS.contains(request.getMethod())
                || origin == null
                || stripTrailingSlash(origin).equalsIgnoreCase(allowedOrigin)
                || isSameOrigin(origin, request)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), new ErrorResponse(
                HttpStatus.FORBIDDEN.value(), "FORBIDDEN", "Origin not allowed", List.of()));
    }

    /**
     * Same-origin check via the Host header rather than the request scheme —
     * behind the deployment proxy the scheme seen by the app can differ from
     * the one in the Origin header. Default ports are omitted on both sides.
     */
    private boolean isSameOrigin(String origin, HttpServletRequest request) {
        try {
            URI uri = URI.create(origin);
            if (uri.getHost() == null) return false;
            String originHost = uri.getPort() == -1 ? uri.getHost() : uri.getHost() + ":" + uri.getPort();
            return originHost.equalsIgnoreCase(request.getHeader("Host"));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static String stripTrailingSlash(String value) {
        return value != null && value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
