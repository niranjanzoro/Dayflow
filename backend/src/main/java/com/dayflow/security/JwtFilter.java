package com.dayflow.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT authentication filter - owned by M2.
 *
 * Runs once per request. Reads "Authorization: Bearer <token>" (per §4.7
 * checklist), validates the token, and — if valid — populates the
 * SecurityContext with the caller's email and a ROLE_* authority derived
 * from the "role" claim, so downstream @PreAuthorize / SecurityConfig
 * rules can distinguish EMPLOYEE vs HR.
 *
 * Requests without a valid token simply pass through unauthenticated;
 * SecurityConfig decides which paths require authentication.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        try {
            final String email = jwtUtil.extractEmail(token);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (!jwtUtil.isTokenExpired(token)) {
                    String role = jwtUtil.extractRole(token);
                    String employeeId = jwtUtil.extractEmployeeId(token);

                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

                    var authToken = new UsernamePasswordAuthenticationToken(
                            email, // principal - used downstream to resolve "me" endpoints
                            null,
                            authorities
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // Stash employeeId on the request so controllers/services
                    // can resolve "me" endpoints without re-parsing the token.
                    request.setAttribute("employeeId", employeeId);
                    request.setAttribute("email", email);

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception ex) {
            // Invalid/expired/malformed token: leave SecurityContext empty.
            // SecurityConfig will reject the request if the path requires auth.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}