package com.dayflow.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private static final String SECRET = "test-secret-key-for-dayflow-hrms-0123456789";
    private static final long TTL_MS = 60_000L;

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", TTL_MS);
    }

    @Test
    void roundTripsAllClaimsThroughTheToken() {
        String token = jwtUtil.generateToken("jane@corp.com", "EMP100001", "EMPLOYEE", "Jane Doe");

        assertThat(token).isNotBlank();
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("jane@corp.com");
        assertThat(jwtUtil.extractEmployeeId(token)).isEqualTo("EMP100001");
        assertThat(jwtUtil.extractRole(token)).isEqualTo("EMPLOYEE");
        assertThat(jwtUtil.extractName(token)).isEqualTo("Jane Doe");
        assertThat(jwtUtil.isTokenValid(token, "jane@corp.com")).isTrue();
    }

    @Test
    void rejectsTokensSignedWithADifferentSecret() {
        String token = jwtUtil.generateToken("jane@corp.com", "EMP100001", "EMPLOYEE", "Jane Doe");

        JwtUtil attacker = new JwtUtil();
        ReflectionTestUtils.setField(attacker, "secret", "another-secret-key-entirely-9876543210abcdef");
        ReflectionTestUtils.setField(attacker, "expirationMs", TTL_MS);

        assertThatThrownBy(() -> attacker.isTokenValid(token, "jane@corp.com"))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void detectsExpiredTokens() {
        ReflectionTestUtils.setField(jwtUtil, "expirationMs", -1_000L);
        String token = jwtUtil.generateToken("jane@corp.com", "EMP100001", "EMPLOYEE", "Jane Doe");

        assertThat(jwtUtil.isTokenExpired(token)).isTrue();
        assertThat(jwtUtil.isTokenValid(token, "jane@corp.com")).isFalse();
    }

    @Test
    void expirationIsIssuedAtPlusTtl() {
        Date before = new Date();
        String token = jwtUtil.generateToken("jane@corp.com", "EMP100001", "EMPLOYEE", "Jane Doe");

        long lifetime = jwtUtil.extractExpiration(token).getTime() - before.getTime();
        assertThat(lifetime).isBetween(TTL_MS - 2_000L, TTL_MS + 1_000L);
    }
}
