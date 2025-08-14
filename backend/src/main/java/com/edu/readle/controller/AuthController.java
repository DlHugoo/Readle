package com.edu.readle.controller;

import com.edu.readle.dto.AuthResponse;
import com.edu.readle.dto.LoginRequest;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.UserRepository;
import com.edu.readle.service.AuthService;
import com.edu.readle.service.BadgeService;
import com.edu.readle.service.EmailVerificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final BadgeService badgeService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(AuthService authService,
                          UserRepository userRepository,
                          BadgeService badgeService,
                          EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.badgeService = badgeService;
        this.emailVerificationService = emailVerificationService;
    }

    /**
     * Create the user (emailVerified defaults to false), then send an OTP to their email.
     * Returns a simple message; token will be issued only after successful login (post-verification).
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody UserEntity user) throws Exception {
        // Persist the user using your existing flow (ensure emailVerified is false by default)
        authService.register(user);

        // Send verification code
        String displayName = user.getFirstName() != null && !user.getFirstName().isBlank()
                ? user.getFirstName()
                : (user.getUsername() != null ? user.getUsername() : "there");
        emailVerificationService.sendCode(user.getEmail(), displayName);

        return ResponseEntity.ok(Map.of("message", "Check your email for the verification code."));
    }

    /**
     * Verify the OTP. On success, the user's emailVerified flag is set to true.
     */
    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestBody VerifyRequest req) {
        emailVerificationService.verifyCode(req.getEmail(), req.getCode());
        return ResponseEntity.ok(Map.of("message", "Email verified. You can now log in."));
    }

    /**
     * Resend a new verification code to the user's email.
     */
    @PostMapping("/resend")
    public ResponseEntity<Map<String, String>> resend(@RequestBody ResendRequest req) throws Exception {
        String displayName = userRepository.findByEmail(req.getEmail())
                .map(u -> u.getFirstName() != null && !u.getFirstName().isBlank() ? u.getFirstName()
                        : (u.getUsername() != null ? u.getUsername() : "there"))
                .orElse("there");
        emailVerificationService.sendCode(req.getEmail(), displayName);
        return ResponseEntity.ok(Map.of("message", "A new verification code has been sent."));
    }

    /**
     * Login is blocked until the user verifies their email.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found with email: " + request.getEmail()));

        if (!user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Please verify your email first.");
        }

        String token = authService.authenticate(request.getEmail(), request.getPassword());

        // Track user login for badge progress (only after successful login)
        badgeService.trackUserLogin(user.getId());

        return ResponseEntity.ok(new AuthResponse(token, user.getRole().name(), user.getId()));
    }

    /** Simple DTOs for verify/resend to avoid adding new files right now. */
    public static class VerifyRequest {
        private String email;
        private String code;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }

    public static class ResendRequest {
        private String email;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}
