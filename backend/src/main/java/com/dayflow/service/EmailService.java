package com.dayflow.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails (verification codes).
 *
 * When dayflow.mail.enabled=false (local dev / CI without SMTP), the code is
 * logged instead so the signup flow stays testable end to end.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String BRAND_GOLD = "#E1A940";

    private final JavaMailSender mailSender;

    @Value("${dayflow.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${dayflow.mail.from:no-reply@dayflow.com}")
    private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendVerificationCode(String to, String name, String code) {
        if (!mailEnabled) {
            log.info("[MAIL DISABLED] Verification code for {} ({}): {}", to, name, code);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from, "Dayflow HRMS");
            helper.setTo(to);
            helper.setSubject("Verify your email - Dayflow HRMS");
            helper.setText(buildVerificationHtml(name, code), true);
            mailSender.send(message);
            log.info("Verification email sent to {}", to);
        } catch (Exception e) {
            // Never fail registration because of a mail outage - the user can
            // trigger a fresh code via POST /api/auth/resend-verification.
            log.error("Failed to send verification email to {}", to, e);
        }
    }

    private String buildVerificationHtml(String name, String code) {
        return """
                <!DOCTYPE html>
                <html>
                <body style="margin:0;padding:0;background-color:#F4F6F9;font-family:'Segoe UI',Arial,sans-serif;">
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#F4F6F9;padding:32px 12px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"
                               style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(24,41,64,0.08);">
                          <tr>
                            <td style="background:linear-gradient(135deg,#223A5E 0%%,#16283F 100%%);padding:28px 36px;">
                              <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;
                                           background:%s;color:#16283F;border-radius:9px;font-weight:800;font-size:18px;">D</span>
                              <span style="color:#ffffff;font-size:19px;font-weight:700;margin-left:10px;">Dayflow HRMS</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:36px;">
                              <h1 style="margin:0 0 8px;font-size:21px;color:#223A5E;">Verify your email</h1>
                              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#5B6478;">
                                Hi %s,<br/>
                                Use the verification code below to activate your Dayflow account.
                                It expires in 15 minutes.
                              </p>
                              <div style="text-align:center;margin:26px 0;">
                                <span style="display:inline-block;letter-spacing:10px;font-size:30px;font-weight:700;
                                             color:#223A5E;background:#EEF2F7;border-radius:10px;padding:16px 26px;">%s</span>
                              </div>
                              <p style="margin:0;font-size:13px;line-height:1.6;color:#8891A3;">
                                Didn't create an account? You can safely ignore this email.
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:18px 36px;border-top:1px solid #E4E7ED;font-size:12px;color:#8891A3;">
                              &copy; %s Dayflow HRMS. All rights reserved.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(BRAND_GOLD, escape(name), escape(code), java.time.Year.now().getValue());
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
