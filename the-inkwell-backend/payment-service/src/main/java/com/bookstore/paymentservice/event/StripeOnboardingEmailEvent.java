package com.bookstore.paymentservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StripeOnboardingEmailEvent {
    private String toEmail;
    private String storeName;
    private String onboardingUrl;
}
