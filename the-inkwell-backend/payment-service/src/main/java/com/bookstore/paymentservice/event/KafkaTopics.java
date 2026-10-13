package com.bookstore.paymentservice.event;

import lombok.NoArgsConstructor;

@NoArgsConstructor
public final class KafkaTopics {

    public final static String ORDER_CREATED = "order-created";
    public final static String PAYMENT_COMPLETED = "payment-completed";
    public final static String DELIVERY_CONFIRMED = "delivery-confirmed";
    public static final String STORE_CREATED = "store-created";
    public static final String STRIPE_ACCOUNT_CREATED = "stripe-account-created";
    public static final String STRIPE_ACCOUNT_UPDATED = "stripe-account-updated";
    public static final String ORDER_REFUNDED = "order-refunded";
    public static final String SUBSCRIPTION_ACTIVATED = "subscription-activated";
    public static final String SUBSCRIPTION_CANCELLED = "subscription-cancelled";
    public static final String STRIPE_ONBOARDING_EMAIL = "stripe-onboarding-email";

}

