package com.bookstore.paymentservice.event;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StripeAccountUpdatedEvent {
    private String stripeAccountId;
    private boolean onboardingComplete;
}
