package com.edu.readle.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserLinkService userLinkService;

    @Value("${app.url:http://localhost:5173}")
    private String appUrl;

    public OAuth2SuccessHandler(JwtService jwtService, UserLinkService userLinkService) {
        this.jwtService = jwtService;
        this.userLinkService = userLinkService;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {

        OAuth2AuthenticationToken auth = (OAuth2AuthenticationToken) authentication;
        DefaultOidcUser principal = (DefaultOidcUser) auth.getPrincipal();
        Map<String, Object> attrs = principal.getAttributes();

        String email  = (String) (attrs.getOrDefault("email", attrs.get("preferred_username")));
        if (email == null || email.isBlank()) {
            // Safety: if Azure doesn't send an email, bounce back to login with an error
            String fallback = (appUrl == null || appUrl.isBlank()) ? "http://localhost:5173" : appUrl.trim();
            response.sendRedirect(fallback + "/login?oauth=missing_email");
            return;
        }

        String given  = (String) attrs.getOrDefault("given_name", "");
        String family = (String) attrs.getOrDefault("family_name", "");

        AppUser user = userLinkService.linkOrCreate(email, given, family);

        // Your current JwtService: generateToken(String username, Long userId)
        String jwt = jwtService.generateToken(email, user.getId());

        // Decide the post-login page by role
        String role = String.valueOf(user.getRole());
        String nextPath;
        switch (role) {
            case "ADMIN"   -> nextPath = "/admin-dashboard";
            case "TEACHER" -> nextPath = "/classroom";
            default        -> nextPath = "/library"; // STUDENT / fallback
        }

        // IMPORTANT: React route is /auth/callback (not /authCallback)
        String base = (appUrl == null || appUrl.isBlank()) ? "http://localhost:5173" : appUrl.trim();
        String redirect = UriComponentsBuilder
                .fromUriString(base)
                .path("/authCallback") 
                .queryParam("token", jwt)      // do not re-encode
                .queryParam("next", nextPath)  // tell FE where to go
                .build(true)
                .toUriString();

        response.setStatus(HttpServletResponse.SC_FOUND);
        response.setHeader(HttpHeaders.LOCATION, redirect);
        // or simply: response.sendRedirect(redirect);
    }
}
