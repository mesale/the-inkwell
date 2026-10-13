package com.bookstore.paymentservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderCreatedEvent {

    private UUID orderId;
    private String buyerKeycloakId;
    private UUID branchId;
    private UUID storeId;
    private BigDecimal totalPrice;
    private String shippingAddress;

}
