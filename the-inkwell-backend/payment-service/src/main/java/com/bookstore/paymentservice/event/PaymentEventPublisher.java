package com.bookstore.paymentservice.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishPaymentCompletes(PaymentCompletedEvent event){

        kafkaTemplate.send(KafkaTopics.PAYMENT_COMPLETED,
                event.getOrderId().toString(), event)
                .whenComplete((result, ex) ->{
                    if (ex != null)
                        log.error("Failed to publish PaymentCompletedEvent for orderId: {}", event.getOrderId());
                    else
                        log.info("Published PaymentCompleted Event for orderId: {}", event.getOrderId());
                });

    }

    public void publishStripeAccountCreated(StripeAccountCreatedEvent event) {
        kafkaTemplate.send(KafkaTopics.STRIPE_ACCOUNT_CREATED,
                        event.getStoreId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish StripeAccountCreatedEvent for storeId: {}",
                                event.getStoreId(), ex);
                    } else {
                        log.info("Published StripeAccountCreatedEvent for storeId: {}",
                                event.getStoreId());
                    }
                });
    }

    public void publishStripeAccountUpdated(StripeAccountUpdatedEvent event) {

        kafkaTemplate.send(KafkaTopics.STRIPE_ACCOUNT_UPDATED,
                        event.getStripeAccountId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish StripeAccountUpdatedEvent for storeId: {}",
                                event.getStripeAccountId(), ex);
                    } else {
                        log.info("Published StripeAccountUpdatedEvent for storeId: {}",
                                event.getStripeAccountId());
                    }
                });

    }

    public void publishOrderRefunded(OrderRefundedEvent event) {
        kafkaTemplate.send(KafkaTopics.ORDER_REFUNDED,
                        event.getOrderId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish OrderRefundedEvent for orderId: {}", event.getOrderId(), ex);
                    } else {
                        log.info("Published OrderRefundedEvent for orderId: {}", event.getOrderId());
                    }
                });
    }

    public void publishSubscriptionActivated(SubscriptionActivatedEvent event) {
        kafkaTemplate.send(KafkaTopics.SUBSCRIPTION_ACTIVATED,
                        event.getStoreId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish SubscriptionActivatedEvent for storeId: {}", event.getStoreId(), ex);
                    } else {
                        log.info("Published SubscriptionActivatedEvent for storeId: {}", event.getStoreId());
                    }
                });
    }

    public void publishSubscriptionCancelled(SubscriptionCancelledEvent event) {
        kafkaTemplate.send(KafkaTopics.SUBSCRIPTION_CANCELLED,
                        event.getStoreId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish SubscriptionCancelledEvent for storeId: {}", event.getStoreId(), ex);
                    } else {
                        log.info("Published SubscriptionCancelledEvent for storeId: {}", event.getStoreId());
                    }
                });
    }

    public void publishStripeOnboardingEmail(StripeOnboardingEmailEvent event) {
        kafkaTemplate.send(KafkaTopics.STRIPE_ONBOARDING_EMAIL, event.getToEmail(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null)
                        log.error("Failed to publish StripeOnboardingEmailEvent for toEmail: {}", event.getToEmail(), ex);
                    else
                        log.info("Published StripeOnboardingEmailEvent for toEmail: {}", event.getToEmail());
                });
    }

}
