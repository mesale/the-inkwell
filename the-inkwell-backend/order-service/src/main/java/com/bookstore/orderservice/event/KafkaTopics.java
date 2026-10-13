package com.bookstore.orderservice.event;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class KafkaTopics {

    public static final String ORDER_CREATED = "order-created";
    public static final String PAYMENT_COMPLETED = "payment-completed";
    public static final String DELIVERY_CONFIRMED = "delivery-confirmed";
    public static final String ORDER_REFUNDED = "order-refunded";

}
