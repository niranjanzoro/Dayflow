package com.dayflow.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * JWT generation and validation - owned by M2.
 *
 * Token subject = employee email (used as username).
 * Claims carry employeeId, role, and name so the frontend's auth
 * response (§4.5) and JwtFilter can both work without extra DB hits.
 */
@Component
public class JwtUtil {

    @Value("${dayflow.jwt.secret}")
    private String secret;

    @Value("${dayflow.jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey getSigningKey() {
        // For a plain-text secret (not base64), sign with UTF-8 bytes directly.
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(String email, String employeeId, String role, String name) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("employeeId", employeeId);
        claims.put("role", role);
        claims.put("name", name);
        return buildToken(claims, email);
    }

    private String buildToken(Map<String, Object> claims, String subject) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractEmployeeId(String token) {
        return extractAllClaims(token).get("employeeId", String.class);
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public String extractName(String token) {
        return extractAllClaims(token).get("name", String.class);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token, String expectedEmail) {
        final String email = extractEmail(token);
        return email.equals(expectedEmail) && !isTokenExpired(token);
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
}