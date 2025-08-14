package com.edu.readle.service;

import java.util.stream.Collectors;

public class EmailTemplates {
  public static String verifyEmailHtml(String appName, String userName, String otp,
                                       int minutes, String verifyUrl, String logoUrl) {
    String boxes = otp.chars().mapToObj(c ->
      "<td style='border:1px solid #d1d5db;border-radius:8px;width:44px;height:44px;text-align:center;vertical-align:middle;margin:0 6px;'>" +
      "<div style=\"font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:18px;line-height:44px;color:#111827;font-weight:700;\">" +
      (char)c + "</div></td>"
    ).collect(Collectors.joining());

    return """
<!doctype html><html><body style="margin:0;padding:0;background:#f4f6f9;">
<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;"><tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06);">
    <tr><td style="background:#1e3a8a;padding:28px 24px;text-align:center;">
      <img src="%s" alt="%s logo" width="36" height="36" style="display:block;margin:0 auto 10px;border:0;outline:none;">
      <div style="font:12px/1.4 Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;letter-spacing:.12em;color:#c7d2fe;text-transform:uppercase;margin-bottom:6px;">Thanks for signing up!</div>
      <div style="font:700 22px/28px Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#fff;">Verify Your E-Mail Address</div>
    </td></tr>
    <tr><td style="padding:28px 24px;background:#fff;">
      <p style="margin:0 0 12px;font:16px/24px Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">Hello %s,</p>
      <p style="margin:0 0 20px;font:16px/24px Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
        Please use the following One-Time Password (OTP) to verify your email for <strong>%s</strong>:
      </p>
      <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;"><tr>%s</tr></table>
      <p style="margin:0 0 18px;font:14px/22px Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#6b7280;">
        This passcode will be valid for the next <strong>%d minutes</strong>. If it doesn’t work, use the button below.
      </p>
      <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:6px 0 18px;">
        <a href="%s" style="display:inline-block;background:#ea580c;border-radius:8px;padding:12px 20px;color:#fff;font:700 16px/1 Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;text-decoration:none;">Verify Email</a>
      </td></tr></table>
      <p style="margin:0;font:12px/18px Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#6b7280;">
        If you didn’t create an account, you can safely ignore this email.
      </p>
    </td></tr>
    <tr><td style="padding:16px 24px;text-align:center;background:#f3f4f6;">
      <p style="margin:0;font:12px/18px Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#6b7280;">© %s • This email was sent automatically — please do not reply</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>
""".formatted(logoUrl, appName, userName, appName, boxes, minutes, verifyUrl, appName);
  }
}
