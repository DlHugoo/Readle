package com.edu.readle.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailerService {
  private final JavaMailSender mailSender;
  private final String from;
  private final String replyTo;

  public MailerService(JavaMailSender mailSender,
                       @Value("${app.mail.from:}") String from,
                       @Value("${app.mail.replyTo:}") String replyTo) {
    this.mailSender = mailSender;
    this.from = from == null ? "" : from;
    this.replyTo = replyTo == null ? "" : replyTo;
  }

  // Backwards compatible
  public void sendHtml(String to, String subject, String html) throws Exception {
    sendHtml(to, subject, html, "This email contains HTML content. If you see this, "
        + "please enable HTML or use the provided verification link.");
  }

  // Preferred: send plain text + HTML
  public void sendHtml(String to, String subject, String html, String textFallback) throws Exception {
    if (from.isBlank()) throw new IllegalStateException("Missing app.mail.from (MAIL_FROM env var).");
    MimeMessage msg = mailSender.createMimeMessage();
    MimeMessageHelper h = new MimeMessageHelper(msg, true, "UTF-8");
    h.setTo(to);
    h.setFrom(from, "Readle");
    if (!replyTo.isBlank()) h.setReplyTo(replyTo, "Readle Support");
    h.setSubject(subject);
    h.setText(textFallback, html); // plain text + HTML
    mailSender.send(msg);
  }
}
