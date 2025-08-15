package com.edu.readle.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Service
public class JwtService {

    private final Key key;
    private final long ttlMs;
    private final String issuer;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.ttl-minutes:1440}") long ttlMinutes,          // default: 24h
            @Value("${spring.application.name:readle}") String issuer       // issuer tag
    ) {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("app.jwt.secret must be at least 32 characters");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ttlMs = ttlMinutes * 60_000L;
        this.issuer = issuer;
    }

    /** Keep your existing signature used by OAuth2SuccessHandler */
    public String generateToken(String username, Long userId) {
        return generateToken(username, userId, null);
    }

    /** Overload that also embeds a role claim if you want it */
    public String generateToken(String username, Long userId, String role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + ttlMs);

        JwtBuilder b = Jwts.builder()
                .setSubject(username)
                .setIssuer(issuer)
                .setIssuedAt(now)
                .setExpiration(exp)
                .addClaims(Map.of("uid", userId));

        if (role != null) {
            b.claim("role", role);
        }

        return b.signWith(key, SignatureAlgorithm.HS256).compact();
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Kept for compatibility with any existing filter code */
    public boolean validateToken(String token, String expectedUsername) {
        try {
            Jws<Claims> jws = parse(token);
            Claims c = jws.getBody();
            if (c.getExpiration().before(new Date())) return false;
            return expectedUsername == null || expectedUsername.equals(c.getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return parse(token).getBody().getSubject();
    }

    public Long extractUserId(String token) {
        Object v = parse(token).getBody().get("uid");
        return (v == null) ? null : Long.valueOf(String.valueOf(v));
    }

    public String extractRole(String token) {
        Object v = parse(token).getBody().get("role");
        return v == null ? null : String.valueOf(v);
    }

    private Jws<Claims> parse(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
    }

    /** Convenience when reading the Authorization header */
    public static String stripBearer(String authHeader) {
        if (authHeader == null) return null;
        return authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
    }
}
