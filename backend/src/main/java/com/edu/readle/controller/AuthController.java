package com.edu.readle.controller;

import com.edu.readle.dto.AuthResponse;
import com.edu.readle.dto.LoginRequest;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.UserRepository;
import com.edu.readle.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody UserEntity user) {
        String token = authService.register(user);
        return ResponseEntity.ok(new AuthResponse(token, user.getRole().name(), user.getId()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        String token = authService.authenticate(request.getEmail(), request.getPassword());

        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        return ResponseEntity.ok(new AuthResponse(token, user.getRole().name(), user.getId()));
    }
}
