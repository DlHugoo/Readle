package com.edu.readle.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;

@Service
public class MailerService {

    private static final Logger log = LoggerFactory.getLogger(MailerService.class);

    private final JavaMailSender mailSender;
    private final String from;
    private final String replyTo;
    private final boolean emailEnabled;

    public MailerService(
            JavaMailSender mailSender,
            @Value("${app.mail.from}") String from,
            @Value("${app.mail.replyTo:}") String replyTo,
            @Value("${app.email.enabled:true}") boolean emailEnabled
    ) {
        this.mailSender = mailSender;
        this.from = from;
        this.replyTo = replyTo;
        this.emailEnabled = emailEnabled;
    }

    /**
     * Sends an email with plain-text and HTML bodies.
     * @return true if SMTP accepted the message; false if building/sending failed (or config invalid).
     */
    public boolean sendHtml(String to, String subject, String html, String text) {
        // Dev/off switch: treat as success so flows can continue during local testing
        if (!emailEnabled) {
            log.warn("Email sending is DISABLED (app.email.enabled=false) → skipping SMTP send. to={}, subject={}", to, subject);
            return true;
        }

        if (!StringUtils.hasText(from)) {
            log.error("app.mail.from is empty — cannot send email to={} subject={}", to, subject);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();

            // true = multipart; UTF-8 for safety with non-ASCII chars
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(to);
            if (StringUtils.hasText(replyTo)) helper.setReplyTo(replyTo);
            helper.setSubject(subject);

            // Provide both plain text and HTML (better deliverability)
            String plain = (text != null) ? text : (html != null ? html.replaceAll("<[^>]+>", "") : "");
            String htmlBody = (html != null) ? html : plain;
            helper.setText(plain, htmlBody); // (plain, html)

            mailSender.send(message);
            log.info("SMTP accepted message → to={}, subject={}", to, subject);
            return true;

        } catch (MessagingException e) {
            // building the message failed
            log.error("Failed to build email to={} subject={} : {}", to, subject, e.getMessage());
            return false;

        } catch (MailException e) {
            // transport/connect/auth problems — SMTP did not accept the message
            log.error("SMTP send FAILED to={} subject={} : {}", to, subject, e.getMessage());
            return false;
        }
    }
}
