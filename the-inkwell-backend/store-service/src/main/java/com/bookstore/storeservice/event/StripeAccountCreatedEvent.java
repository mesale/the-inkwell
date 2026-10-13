package com.bookstore.storeservice.event;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StripeAccountCreatedEvent {

    private UUID storeId;
    private String stripeAccountId;

}
