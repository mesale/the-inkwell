package com.bookstore.storeservice.event;

import lombok.*;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionActivatedEvent {
    private UUID storeId;
    private String stripeSubscriptionId;
    private String stripePriceId;
    private String currentPeriodEnd;
}
