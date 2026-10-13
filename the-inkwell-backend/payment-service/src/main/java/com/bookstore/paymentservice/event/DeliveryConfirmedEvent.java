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
public class DeliveryConfirmedEvent {

    private UUID orderId;
    private UUID storeId;
    private UUID branchId;
    private String stripePaymentId;
    private String stripeAccountId;
    private BigDecimal totalPrice;
    private BigDecimal commission;
    private BigDecimal amountToRelease;

}
