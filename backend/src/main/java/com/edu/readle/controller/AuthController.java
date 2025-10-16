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
     * Registers a user (emailVerified defaults to false) and sends an OTP.
     * We intentionally DO NOT return a token here; token is issued on /login after verification.
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody UserEntity user) {
        authService.register(user);

        String displayName = (user.getFirstName() != null && !user.getFirstName().isBlank())
                ? user.getFirstName()
                : (user.getUsername() != null && !user.getUsername().isBlank() ? user.getUsername() : "there");

        // make sendCode(...) return boolean in EmailVerificationService
        boolean emailSent = emailVerificationService.sendCodeWithStatus(user.getEmail(), displayName);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", emailSent
                        ? "Check your email for the verification code."
                        : "We created your account but couldn’t send the email right now. Please try Resend.",
                "emailSent", emailSent
        ));
}

    /**
     * Verify the OTP. On success, the user's emailVerified flag is set to true.
     */
    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestBody VerifyRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()
                || req.getCode() == null || req.getCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and code are required.");
        }
        emailVerificationService.verifyCode(req.getEmail(), req.getCode());
        return ResponseEntity.ok(Map.of("message", "Email verified. You can now log in."));
    }

    /**
     * Resend a new verification code to the user's email.
     */
    @PostMapping("/resend")
    public ResponseEntity<Map<String, String>> resend(@RequestBody ResendRequest req) throws Exception {
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required.");
        }
        String displayName = userRepository.findByEmail(req.getEmail())
                .map(u -> (u.getFirstName() != null && !u.getFirstName().isBlank())
                        ? u.getFirstName()
                        : (u.getUsername() != null && !u.getUsername().isBlank() ? u.getUsername() : "there"))
                .orElse("there");

        emailVerificationService.sendCode(req.getEmail(), displayName);
        return ResponseEntity.ok(Map.of("message", "A new verification code has been sent."));
    }

    /**
     * Login is blocked until the user verifies their email.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required.");
        }

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
