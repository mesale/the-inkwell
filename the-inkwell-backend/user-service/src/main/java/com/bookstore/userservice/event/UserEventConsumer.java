package com.bookstore.userservice.event;

import com.bookstore.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventConsumer {

    private final UserService userService;

    @KafkaListener(topics = KafkaTopics.CREATE_STORE_OWNER, groupId = "user-service")
    public void handleCreateStoreOwner(CreateStoreOwnerEvent event){
        log.info("Received CreateStoreOwnerEvent for storeId: {}", event.getStoreId());
        try{
            userService.createStoreOwnerFromStoreCreated(event);
        }catch (Exception ex){
            log.error("Failed to process CreateStoreOwnerEvent for storeId: {}", event.getStoreId(), ex);
        }
    }

}
