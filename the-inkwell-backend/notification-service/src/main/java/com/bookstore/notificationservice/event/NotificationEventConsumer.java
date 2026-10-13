package com.bookstore.notificationservice.event;

import com.bookstore.notificationservice.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final EmailService emailService;

    @KafkaListener(topics = "store-application-email", groupId = "notification-service-group")
    public void handleStoreApplicationEmailEvent(StoreApplicationEmailEvent event) {
        log.info("Received StoreApplicationEmailEvent for: {}", event.getToEmail());
        emailService.sendStoreApplicationEmail(event);
    }

    @KafkaListener(topics = "complete-profile-email", groupId = "notification-service-group")
    public void handleCompleteProfileEmailEvent(CompleteProfileEmailEvent event) {
        log.info("Received CompleteProfileEmailEvent for: {}", event.getToEmail());
        emailService.sendCompleteProfileEmail(event);
    }

    @KafkaListener(topics = "stripe-onboarding-email", groupId = "notification-service-group")
    public void handleStripeOnboardingEmailEvent(StripeOnboardingEmailEvent event) {
        log.info("Received StripeOnboardingEmailEvent for: {}", event.getToEmail());
        emailService.sendStripeOnboardingEmail(event);
    }
    
    @KafkaListener(topics = "employee-invitation-email", groupId = "notification-service-group")
    public void handleEmployeeInvitationEmailEvent(EmployeeInvitationEmailEvent event) {
        log.info("Received EmployeeInvitationEmailEvent for: {}", event.getToEmail());
        emailService.sendEmployeeInvitationEmail(event);
    }
}
