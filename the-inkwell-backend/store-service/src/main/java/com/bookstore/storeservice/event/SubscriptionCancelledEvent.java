package com.bookstore.storeservice.event;

import lombok.*;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionCancelledEvent {
    private UUID storeId;
    private String stripeSubscriptionId;
}
