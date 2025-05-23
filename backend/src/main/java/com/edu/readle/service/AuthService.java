package com.edu.readle.service;

import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.UserRepository;
import com.edu.readle.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final BadgeService badgeService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authManager,
                       BadgeService badgeService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authManager = authManager;
        this.badgeService = badgeService;
    }

    public String register(UserEntity user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        // Track first login for new users to award the welcome badge
        badgeService.trackUserLogin(user.getId());
        return jwtService.generateToken(user.getEmail(), user.getId());
    }

    public String authenticate(String email, String password) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
        Optional<UserEntity> user = userRepository.findByEmail(email);
        return user.map(u -> jwtService.generateToken(u.getEmail(), u.getId()))
                   .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
