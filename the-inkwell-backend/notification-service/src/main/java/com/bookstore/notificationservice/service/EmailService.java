package com.bookstore.notificationservice.service;

import com.bookstore.notificationservice.event.CompleteProfileEmailEvent;
import com.bookstore.notificationservice.event.StoreApplicationEmailEvent;
import com.bookstore.notificationservice.event.StripeOnboardingEmailEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void sendStoreApplicationEmail(StoreApplicationEmailEvent event) {
        String applicationLink = frontendUrl + "/store-application?token=" + event.getToken();
        String subject = "Complete Your Bookstore Application";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Welcome to the Online Bookstore Platform</h2>
                    <p>Dear %s,</p>
                    <p>Thank you for your interest in becoming a store on our platform.</p>
                    <p>Please click the button below to complete your store registration form.
                       This link will expire in <strong>48 hours</strong>.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s"
                           style="background-color: #4CAF50; color: white; padding: 14px 24px;
                                  text-decoration: none; border-radius: 4px; font-size: 16px;">
                            Complete Registration
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p><a href="%s">%s</a></p>
                    <p>If you did not request this, please ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Online Bookstore Platform Team</p>
                </body>
                </html>
                """.formatted(event.getApplicantName(), applicationLink, applicationLink, applicationLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(event.getToEmail());
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("Store Application Mail sent to: {}", event.getToEmail());
        } catch (MessagingException e) {
            log.error("Failed to send Store Application Email to: {}", event.getToEmail(), e);
        }
    }

    public void sendCompleteProfileEmail(CompleteProfileEmailEvent event) {
        String completionLink = frontendUrl + "/complete-profile";
        String subject = "Action Required: Complete Your Store Profile";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #4CAF50;">Congratulations!</h2>
                    <p>Dear <strong>%s</strong>,</p>
                    <p>Your store has been successfully created on our platform.</p>
                    <p>To start listing books and receiving payments, you must complete your business profile and upload your identity documents for verification.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s" 
                           style="background-color: #4CAF50; color: white; padding: 14px 24px; 
                                  text-decoration: none; border-radius: 4px; font-size: 16px;">
                            Complete Store Profile
                        </a>
                    </div>
                    <p>Once submitted, our team will review your documents within 24-48 hours.</p>
                    <br>
                    <p>Best regards,<br>Online Bookstore Platform Team</p>
                </body>
                </html>
                """.formatted(event.getStoreName(), completionLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(event.getToEmail());
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("Completion Profile Mail sent to: {}", event.getToEmail());
        } catch (MessagingException e) {
            log.error("Failed to send Completion Email to: {}", event.getToEmail(), e);
        }
    }

    public void sendStripeOnboardingEmail(StripeOnboardingEmailEvent event) {
        String subject = "Complete Your Payment Setup to Start Receiving Payments";
        String body = """
            <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4CAF50;">You're Almost Ready to Get Paid 🎉</h2>
                <p>Dear <strong>%s</strong>,</p>
                <p>Your store has been successfully created on our platform.</p>
                <p>
                    To start receiving payments from customers, you need to complete your secure payment setup.
                    This is handled through our trusted payment partner and usually takes just a few minutes.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" 
                       style="background-color: #4CAF50; color: white; padding: 14px 24px; 
                              text-decoration: none; border-radius: 4px; font-size: 16px;">
                        Complete Payment Setup
                    </a>
                </div>
                <p>
                    🔒 During setup, you may be asked to provide:
                    <ul>
                        <li>Business or personal details</li>
                        <li>Identity verification documents</li>
                        <li>Bank account information for payouts</li>
                    </ul>
                </p>
                <p>
                    ⏳ <strong>Note:</strong> This link is time-sensitive. If it expires, you can request a new one from your dashboard.
                </p>
                <p>
                    Once completed, your account will be reviewed and activated so you can start accepting payments.
                </p>
                <br>
                <p>Best regards,<br>Online Bookstore Platform Team</p>
            </body>
            </html>
            """.formatted(event.getStoreName(), event.getOnboardingUrl());

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(event.getToEmail());
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("Stripe onboarding email sent to: {}", event.getToEmail());
        } catch (MessagingException e) {
            log.error("Failed to send Stripe onboarding email to: {}", event.getToEmail(), e);
        }
    }

    public void sendEmployeeInvitationEmail(com.bookstore.notificationservice.event.EmployeeInvitationEmailEvent event) {
        String confirmationLink = event.getFrontendUrl() + "/employee/invitation?token=" + event.getToken();
        String subject = "You're Invited to Join a Store on Online Bookstore";
        String body = """
                <html>
                <body style="font-family: Arial, sans-serif; color: #333;">
                    <h2>Store Employment Invitation</h2>
                    <p>Dear %s,</p>
                    <p>You have been invited to join a store branch on our platform as an employee.</p>
                    <p>Please click the button below to confirm and accept this invitation.
                       This link will expire in <strong>7 days</strong>.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="%s"
                           style="background-color: #4CAF50; color: white; padding: 14px 24px;
                                  text-decoration: none; border-radius: 4px; font-size: 16px;">
                            View Invitation Details
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p><a href="%s">%s</a></p>
                    <p>If you did not expect this invitation, you can safely ignore this email.</p>
                    <br>
                    <p>Best regards,<br>Online Bookstore Platform Team</p>
                </body>
                </html>
                """.formatted(event.getUserName(), confirmationLink, confirmationLink, confirmationLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(event.getToEmail());
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            log.info("Employee invitation email sent to: {}", event.getToEmail());
        } catch (MessagingException e) {
            log.error("Failed to send employee invitation email to: {}", event.getToEmail(), e);
        }
    }
}
