package com.bookstore.orderservice.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishOrderCreated(OrderCreatedEvent event){
        kafkaTemplate.send(
                KafkaTopics.ORDER_CREATED,
                event.getOrderId().toString(), event
        ).whenComplete((result, ex) ->{
            if (ex != null)
                log.error("Failed to publish OrderCreatedEvent for orderId: {}", event.getOrderId(), ex);
            else
                log.info("Published OrderCreatedEvent for orderId: {}", event.getOrderId());
        });
    }

    public void publishDeliveryConfirmed(DeliveryConfirmedEvent event){
        kafkaTemplate.send(
                KafkaTopics.DELIVERY_CONFIRMED,
                event.getOrderId().toString(), event
        ).whenComplete((result, ex) -> {
            if (ex != null)
                log.error("Failed to published DeliveryConfirmedEvent for orderId: {}", event.getOrderId(), ex);
            else
                log.info("Published DeliveryConfirmedEvent for orderId: {}", event.getOrderId());
        });
    }

}
