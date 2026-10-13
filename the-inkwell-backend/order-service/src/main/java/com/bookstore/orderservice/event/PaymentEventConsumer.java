package com.bookstore.orderservice.event;

import com.bookstore.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    private final OrderService orderService;

    @KafkaListener(topics = KafkaTopics.PAYMENT_COMPLETED, groupId = "order-service")
    public void handlePaymentCompleted(PaymentCompletedEvent event){
        log.info("Received PaymentCompletedEvent for orderId: {}", event.getOrderId());

        try{
            orderService.handlePaymentCompleted(event);
        }catch(Exception e){
            log.error("Failed to process PaymentCompletedEvent for orderId: {}", event.getOrderId(), e);
        }

    }

    @KafkaListener(topics = KafkaTopics.ORDER_REFUNDED, groupId = "order-service")
    public void handleOrderRefunded(OrderRefundedEvent event) {
        log.info("Received OrderRefundedEvent for orderId: {}", event.getOrderId());

        try {
            orderService.handleOrderRefunded(event);
        } catch (Exception e) {
            log.error("Failed to process OrderRefundedEvent for orderId: {}", event.getOrderId(), e);
        }
    }

}

