package com.musicworkspace.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * In-memory per-IP rate limiting — not shared across instances, move to a
 * distributed store before scaling out.
 */
@Component
public class AuthRateLimiter {

    private static final int LOGIN_PER_MINUTE = 5;
    private static final int REGISTER_PER_MINUTE = 3;
    // Public share links are meant to circulate widely, so the ceiling only
    // exists to bound UUID enumeration / flood, not to throttle real viewers.
    private static final int PUBLIC_PROJECT_PER_MINUTE = 60;

    private final int trustedProxies;

    public AuthRateLimiter(@Value("${app.rate-limit.trusted-proxies:1}") int trustedProxies) {
        this.trustedProxies = trustedProxies;
    }

    // Evicting an idle bucket is lossless: after >= 1 minute the refill has
    // fully restored it, so a fresh bucket is equivalent.
    private final Cache<String, Bucket> loginBuckets = newCache();
    private final Cache<String, Bucket> registerBuckets = newCache();
    private final Cache<String, Bucket> publicProjectBuckets = newCache();

    private static Cache<String, Bucket> newCache() {
        return Caffeine.newBuilder()
                .expireAfterAccess(Duration.ofMinutes(2))
                .maximumSize(100_000)
                .build();
    }

    public void checkLogin(HttpServletRequest request) {
        check(loginBuckets, clientIp(request), LOGIN_PER_MINUTE);
    }

    public void checkRegister(HttpServletRequest request) {
        check(registerBuckets, clientIp(request), REGISTER_PER_MINUTE);
    }

    public void checkPublicProject(HttpServletRequest request) {
        check(publicProjectBuckets, clientIp(request), PUBLIC_PROJECT_PER_MINUTE);
    }

    private void check(Cache<String, Bucket> buckets, String ip, int perMinute) {
        Bucket bucket = buckets.get(ip, key -> newBucket(perMinute));
        if (!bucket.tryConsume(1)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS, "Trop de tentatives, réessaie dans un instant.");
        }
    }

    private Bucket newBucket(int perMinute) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(perMinute)
                        .refillGreedy(perMinute, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    // Behind the proxy the remote address is the proxy itself. Leading
    // X-Forwarded-For entries are client-supplied and spoofable — count from
    // the right: each trusted hop appended exactly one entry, so the real
    // client sits at length - trustedProxies.
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] entries = forwarded.split(",");
            return entries[Math.max(0, entries.length - trustedProxies)].trim();
        }
        return request.getRemoteAddr();
    }
}
