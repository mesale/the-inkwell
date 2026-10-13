package com.bookstore.paymentservice.event;

import com.bookstore.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    private final PaymentService paymentService;

    @KafkaListener(topics = KafkaTopics.STORE_CREATED, groupId = "payment-service")
    public void handleStoreCreated(StoreCreatedEvent event){
        log.info("Received StoreCreatedEvent for storeId: {}", event.getStoreId());

        try {
            paymentService.handleStoreCreated(event);
        }catch (Exception e){
            log.error("Failed to process StoreCreatedEvent for storeId: {}", event.getStoreId());
        }

    }

    @KafkaListener(topics = KafkaTopics.ORDER_CREATED, groupId = "payment-service")
    public void handleOrderCreated(OrderCreatedEvent event){
        log.info("Received OrderCreatedEvent for orderId: {}", event.getOrderId());

        try{
            paymentService.handleOrderCreated(event);
        }catch (Exception ex){
            log.error("Failed to process OrderCreatedEvent for orderId: {}", event.getOrderId(), ex);
        }

    }

    @KafkaListener(topics = KafkaTopics.DELIVERY_CONFIRMED, groupId = "payment-service")
    public void handleDeliveryConfirmed(DeliveryConfirmedEvent event){
        log.info("Received DeliveryCOnfirmedEvent for orderId: {}", event.getOrderId());

        try{
            paymentService.handleDeliveryConfirmed(event);
        }catch (Exception ex){
            log.error("Failed to process DeliveryConfirmedEvent for orderId: {}", event.getOrderId(), ex);
        }

    }

}
