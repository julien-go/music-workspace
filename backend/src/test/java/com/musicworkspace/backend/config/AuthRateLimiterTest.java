package com.musicworkspace.backend.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

class AuthRateLimiterTest {

    private AuthRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new AuthRateLimiter(1);
    }

    private MockHttpServletRequest requestFrom(String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(ip);
        return request;
    }

    @Test
    void login_allowsFiveAttemptsThenThrows429() {
        MockHttpServletRequest request = requestFrom("10.0.0.1");

        for (int i = 0; i < 5; i++) {
            assertThatCode(() -> rateLimiter.checkLogin(request)).doesNotThrowAnyException();
        }

        assertThatThrownBy(() -> rateLimiter.checkLogin(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> org.assertj.core.api.Assertions
                        .assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(429));
    }

    @Test
    void register_allowsThreeAttemptsThenThrows429() {
        MockHttpServletRequest request = requestFrom("10.0.0.1");

        for (int i = 0; i < 3; i++) {
            assertThatCode(() -> rateLimiter.checkRegister(request)).doesNotThrowAnyException();
        }

        assertThatThrownBy(() -> rateLimiter.checkRegister(request))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void buckets_areIndependentPerIp() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.checkLogin(requestFrom("10.0.0.1"));
        }

        assertThatCode(() -> rateLimiter.checkLogin(requestFrom("10.0.0.2")))
                .doesNotThrowAnyException();
    }

    @Test
    void clientIp_ignoresSpoofedForwardedForPrefix() {
        // The client-supplied part of X-Forwarded-For varies on every request;
        // the entry appended by the single trusted hop stays the same. Spoofing
        // must not grant a fresh bucket.
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest request = requestFrom("172.16.0.1");
            request.addHeader("X-Forwarded-For", "fake-" + i + ", 198.51.100.9");
            rateLimiter.checkLogin(request);
        }

        MockHttpServletRequest spoofed = requestFrom("172.16.0.1");
        spoofed.addHeader("X-Forwarded-For", "fake-again, 198.51.100.9");

        assertThatThrownBy(() -> rateLimiter.checkLogin(spoofed))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void clientIp_readsClientBehindTwoTrustedHops() {
        // Prod topology: Netlify appends the client IP, then the Railway edge
        // appends Netlify's IP — the client sits second from the right.
        AuthRateLimiter twoHops = new AuthRateLimiter(2);

        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest request = requestFrom("172.16.0.1");
            request.addHeader("X-Forwarded-For", "203.0.113.7, 10.10.0." + i);
            twoHops.checkLogin(request);
        }

        MockHttpServletRequest sameClient = requestFrom("172.16.0.99");
        sameClient.addHeader("X-Forwarded-For", "spoofed, 203.0.113.7, 10.10.0.99");

        assertThatThrownBy(() -> twoHops.checkLogin(sameClient))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void loginAndRegister_haveSeparateBuckets() {
        MockHttpServletRequest request = requestFrom("10.0.0.1");

        for (int i = 0; i < 3; i++) {
            rateLimiter.checkRegister(request);
        }

        // Register is exhausted; login must still be allowed.
        assertThatCode(() -> rateLimiter.checkLogin(request)).doesNotThrowAnyException();
    }
}
