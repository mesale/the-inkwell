package com.bookstore.orderservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRefundedEvent {

    private UUID orderId;
    private String buyerKeycloakId;
    private BigDecimal refundedAmount;
    private String stripeRefundId;

}
