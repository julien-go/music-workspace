package com.musicworkspace.backend.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * In-memory per-IP rate limiting for the auth endpoints (bucket4j). Good
 * enough for a single-instance MVP: state is lost on restart and not shared
 * across instances — move to a distributed store before scaling out.
 */
@Component
public class AuthRateLimiter {

    private static final int LOGIN_PER_MINUTE = 5;
    private static final int REGISTER_PER_MINUTE = 3;

    // Evicting an idle bucket is lossless: after >= 1 minute without access the
    // greedy refill has fully restored it, so a fresh bucket is equivalent. The
    // size cap only bounds memory under a flood of distinct IPs.
    private final Cache<String, Bucket> loginBuckets = newCache();
    private final Cache<String, Bucket> registerBuckets = newCache();

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

    /**
     * Behind the deployment proxy (Railway) the remote address is the proxy
     * itself — every user would share one bucket. The first X-Forwarded-For
     * entry is the client as seen by the edge; it is spoofable only when the
     * app is exposed without the proxy, which we accept for the MVP.
     */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
