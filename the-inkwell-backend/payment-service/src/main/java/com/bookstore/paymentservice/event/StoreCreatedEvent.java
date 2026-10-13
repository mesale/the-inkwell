package com.bookstore.paymentservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreCreatedEvent {

    private UUID storeId;
    private String businessEmail;
    private String storeName;

}
