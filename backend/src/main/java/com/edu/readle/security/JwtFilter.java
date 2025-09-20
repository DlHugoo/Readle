package com.edu.readle.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import com.edu.readle.service.CustomUserDetailsService;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final AntPathMatcher PATH = new AntPathMatcher();

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    /** Skip filtering for OPTIONS and for public/OAuth endpoints */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getServletPath();

        // Never filter preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        // Skip public endpoints that don't need JWT validation
        List<String> skip = List.of(
                "/oauth2/**",
                "/auth/**",          // includes /auth/microsoft/callback
                "/error",
                "/favicon.ico",
                "/assets/**",
                "/",
                "/index.html",
                "/actuator/health",
                "/api/auth/login",
                "/api/auth/register",
                "/api/auth/verify-email",
                "/api/auth/resend"
        );
        for (String p : skip) {
            if (PATH.match(p, uri)) return true;
        }
        return false;
    }


    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        System.out.println("JwtFilter invoked for: " + request.getRequestURI());

        final String authHeader = request.getHeader("Authorization");
        String email = null;
        String jwt = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                email = jwtService.extractUsername(jwt);
            } catch (Exception e) {
                System.out.println("Invalid JWT format: " + e.getMessage());
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            var userDetails = userDetailsService.loadUserByUsername(email);

            try {
                if (jwtService.validateToken(jwt, userDetails.getUsername())) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("JWT validated and context set for user: " + email);
                } else {
                    System.out.println("Invalid JWT for user: " + email);
                }
            } catch (Exception ex) {
                // Don’t block the chain—just log and proceed (request will be unauthenticated)
                System.out.println("JWT validation error: " + ex.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
