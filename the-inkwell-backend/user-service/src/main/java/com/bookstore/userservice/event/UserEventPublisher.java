package com.bookstore.userservice.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventPublisher {

    private  final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishStoreApplicationApproved(StoreApplicationApprovedEvent event){
        kafkaTemplate.send(KafkaTopics.STORE_APPLICATION_APPROVED,
                event.getApplicationId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null)
                        log.error("Failed to publish StoreApplicationApprovedEvent for applicationId: {}",
                                event.getApplicationId(), ex);
                    else
                        log.info("Published StoreApplicationApprovedEvent for applicationId: {}",
                                event.getApplicationId());
                });
    }

    public void publishStoreApplicationEmail(StoreApplicationEmailEvent event){
        kafkaTemplate.send(KafkaTopics.STORE_APPLICATION_EMAIL,
                event.getToEmail(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null)
                        log.error("Failed to publish StoreApplicationEmailEvent for toEmail: {}",
                                event.getToEmail(), ex);
                    else
                        log.info("Published StoreApplicationEmailEvent for toEmail: {}",
                                event.getToEmail());
                });
    }

    public void publishEmployeeInvitationEmail(EmployeeInvitationEmailEvent event){
        kafkaTemplate.send(KafkaTopics.EMPLOYEE_INVITATION_EMAIL,
                event.getToEmail(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null)
                        log.error("Failed to publish EmployeeInvitationEmailEvent for toEmail: {}",
                                event.getToEmail(), ex);
                    else
                        log.info("Published EmployeeInvitationEmailEvent for toEmail: {}",
                                event.getToEmail());
                });
    }

}
