package com.bookstore.storeservice.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StoreEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishStoreCreated(StoreCreatedEvent event){

        kafkaTemplate.send(KafkaTopics.STORE_CREATED,
                event.getStoreId().toString(), event)
                .whenComplete((result, ex) ->{
                    if (ex != null)
                        log.error("Failed to publish StoreCreatedEvent for orderId: {}", event.getStoreId(), ex);
                    else
                        log.info("Published StoreCreatedEvent for storeId: {}", event.getStoreId());
                });

    }

    public void publishCreateStoreOwner(CreateStoreOwnerEvent event){
        kafkaTemplate.send(KafkaTopics.CREATE_STORE_OWNER,
                event.getStoreId().toString(), event)
                .whenComplete((result, ex) ->{
                    if (ex != null)
                        log.error("Failed to publish CreateStoreOwnerEvent for storeId: {}", event.getStoreId(), ex);
                    else
                        log.info("Published CreateStoreOwnerEvent for storeId: {}", event.getStoreId());
                });
    }

    public void publishCompleteProfileEmail(CompleteProfileEmailEvent event) {
        kafkaTemplate.send(KafkaTopics.COMPLETE_PROFILE_EMAIL, event.getToEmail(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null)
                        log.error("Failed to publish CompleteProfileEmailEvent for toEmail: {}", event.getToEmail(), ex);
                    else
                        log.info("Published CompleteProfileEmailEvent for toEmail: {}", event.getToEmail());
                });
    }

}
