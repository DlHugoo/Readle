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

  public EmailVerificationService(EmailOtpRepository otpRepo,
                                  UserRepository userRepo,
                                  MailerService mailer) {
    this.otpRepo = otpRepo;
    this.userRepo = userRepo;
    this.mailer = mailer;
  }

  @Transactional
  public void sendCode(String email, String displayName) throws Exception {
    // invalidate previous active codes
    otpRepo.consumeAllForEmail(email);

    // generate a 6-digit OTP
    String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));

    EmailOtp otp = new EmailOtp();
    otp.setEmail(email);
    otp.setCode(code);
    otp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
    otpRepo.save(otp);

    // unique subject to avoid Gmail threading
    String subject = "[Readle] Verify your email — code " + code;

    String verifyUrl = "https://example.com/verify?email=" + email + "&code=" + code;
    String logo = "https://dummyimage.com/72x72/1e3a8a/ffffff.png&text=R";

    // HTML + text fallback (improves deliverability)
    String html = EmailTemplates.verifyEmailHtml("Readle", displayName, code, 10, verifyUrl, logo);
    String text = "Hello " + displayName + ",\n\n"
        + "Your Readle verification code is: " + code + "\n"
        + "It expires in 10 minutes.\n\n"
        + "Or click this link to verify: " + verifyUrl + "\n\n"
        + "If you didn’t request this, you can ignore this email.";

    // DEV ONLY: remove before prod if you don't want OTP in logs
    log.info("DEV ONLY — OTP for {} = {}", email, code);

    mailer.sendHtml(email, subject, html, text);
  }

  @Transactional
  public void verifyCode(String email, String code) {
    var otp = otpRepo.findActiveByEmail(email)
        .orElseThrow(() -> new IllegalStateException("No active code. Resend."));

    if (otp.getExpiresAt().isBefore(LocalDateTime.now()))
      throw new IllegalStateException("Code expired.");
    if (otp.getAttempts() >= 5)
      throw new IllegalStateException("Too many attempts.");

    otp.setAttempts(otp.getAttempts() + 1);
    if (!otp.getCode().equals(code))
      throw new IllegalArgumentException("Invalid code.");

    otp.setConsumed(true);

    UserEntity user = userRepo.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found."));
    user.setEmailVerified(true);
    user.setEmailVerifiedAt(LocalDateTime.now());
  }
}
