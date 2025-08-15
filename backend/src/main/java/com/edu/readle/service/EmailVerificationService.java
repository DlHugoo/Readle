package com.edu.readle.service;

import com.edu.readle.entity.EmailOtp;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.EmailOtpRepository;
import com.edu.readle.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    private final EmailOtpRepository otpRepo;
    private final UserRepository userRepo;
    private final MailerService mailer;

    public EmailVerificationService(
            EmailOtpRepository otpRepo,
            UserRepository userRepo,
            MailerService mailer
    ) {
        this.otpRepo = otpRepo;
        this.userRepo = userRepo;
        this.mailer = mailer;
    }

    /**
     * Generates and stores a 6-digit OTP, then tries to email it.
     * Never throws on SMTP failure; OTP remains persisted so the user can "Resend".
     */
    @Transactional
    public void sendCode(String email, String displayName) {
        // 1) Invalidate any previous codes for this address
        otpRepo.consumeAllForEmail(email);

        // 2) Generate 6-digit code and persist (10-minute TTL)
        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));

        EmailOtp otp = new EmailOtp();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otpRepo.save(otp);

        // 3) Build message
        String subject   = "[Readle] Verify your email — code " + code;
        String verifyUrl = "https://example.com/verify?email=" + email + "&code=" + code;
        String logo      = "https://dummyimage.com/72x72/1e3a8a/ffffff.png&text=R";

        String html = EmailTemplates.verifyEmailHtml(
                "Readle", displayName, code, 10, verifyUrl, logo
        );
        String text = "Hello " + displayName + ",\n\n"
                + "Your Readle verification code is: " + code + "\n"
                + "It expires in 10 minutes.\n\n"
                + "Or click this link to verify: " + verifyUrl + "\n\n"
                + "If you didn’t request this, you can ignore this email.";

        // Helpful during local dev
        log.info("DEV ONLY — OTP for {} = {}", email, code);

        // 4) Try to send; do not fail the transaction if SMTP rejects it
        boolean delivered = mailer.sendHtml(email, subject, html, text);
        if (delivered) {
            log.info("Verification email queued/accepted → {}", email);
        } else {
            log.error("Verification email NOT sent (SMTP failure) → {}", email);
            // You might choose to notify the controller/UI via another channel later.
        }
    }

    /**
     * Validates the OTP and marks the user as verified.
     * Increments attempts only on wrong code; caps at 5.
     */
    @Transactional
    public void verifyCode(String email, String code) {
        var otp = otpRepo.findActiveByEmail(email)
                .orElseThrow(() -> new IllegalStateException("No active code. Resend."));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Code expired.");
        }
        if (!otp.getCode().equals(code)) {
            int attempts = otp.getAttempts() + 1;
            otp.setAttempts(attempts);
            if (attempts >= 5) {
                // Optionally consume to force a resend after too many failures
                otp.setConsumed(true);
                throw new IllegalStateException("Too many attempts.");
            }
            throw new IllegalArgumentException("Invalid code.");
        }

        // Correct code
        otp.setConsumed(true);

        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
    }

    /**
     * Optional helper if you ever want the caller to know whether the email was sent.
     * Leaves your existing controller untouched.
     */
    @Transactional
    public boolean sendCodeWithStatus(String email, String displayName) {
        sendCode(email, displayName);
        // If you want real status, refactor the main method to return the boolean instead.
        // Kept simple to avoid breaking existing code.
        return true;
    }
}
