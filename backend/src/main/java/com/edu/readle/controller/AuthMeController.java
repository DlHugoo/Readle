// src/main/java/com/edu/readle/controller/AuthMeController.java
package com.edu.readle.controller;

import com.edu.readle.security.AppUser;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthMeController {

    private final UserRepository userRepository;

    public AuthMeController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "unauthenticated"));
        }

        String email;
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails ud) {
            email = ud.getUsername(); // our JwtFilter should set this to email
        } else if (principal instanceof String s) {
            email = s;
        } else {
            email = authentication.getName();
        }

        UserEntity user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "user-not-found"));
        }

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "role", user.getRole().name(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName()
        ));
    }
}
