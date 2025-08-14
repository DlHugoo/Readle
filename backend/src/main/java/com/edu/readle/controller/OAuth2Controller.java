package com.edu.readle.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Map;

@RestController
@RequestMapping("/api/oauth2")
public class OAuth2Controller {

    @GetMapping("/user")
    public Map<String, Object> getUserInfo(@AuthenticationPrincipal OAuth2User principal) {
        return principal.getAttributes();
    }

    @GetMapping("/login/microsoft")
    public String getMicrosoftLoginUrl() {
        return "{\"url\": \"/oauth2/authorization/microsoft\"}";
    }
}