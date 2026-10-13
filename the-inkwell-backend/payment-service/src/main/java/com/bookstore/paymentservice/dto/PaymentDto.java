package com.bookstore.paymentservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class PaymentDto {

    public record CheckoutResponse(
            UUID orderId,
            UUID transactionId,
            String stripeClientSecret,
            BigDecimal amount
    ) {}

    public record TransactionResponse(
            UUID id,
            UUID orderId,
            UUID storeId,
            UUID branchId,
            BigDecimal amount,
            BigDecimal commissionRate,
            BigDecimal commissionAmount,
            BigDecimal netAmount,
            String stripePaymentIntentId,
            String status,
            LocalDateTime createdAt
    ) {}

    public record PayoutResponse(
            UUID id,
            UUID transactionId,
            UUID storeId,
            BigDecimal amount,
            String stripeTransferId,
            String status,
            LocalDateTime createdAt
    ) {}

    public record RefundResponse(
            UUID orderId,
            String stripeRefundId,
            BigDecimal refundedAmount
    ) {}

    // ── Subscription DTOs ──────────────────────────────────────────────────────

    public record SubscribeSetupResponse(
            UUID storeId,
            String stripeCustomerId,
            String setupIntentClientSecret,
            String priceId
    ) {}

    public record SubscribeConfirmResponse(
            UUID storeId,
            String stripeSubscriptionId,
            String status,
            LocalDateTime currentPeriodEnd
    ) {}

    public record SubscribeConfirmRequest(
            String paymentMethodId
    ) {}

    public record SubscriptionStatusResponse(
            UUID storeId,
            String stripeSubscriptionId,
            String status,          // ACTIVE | PAST_DUE | CANCELED | INCOMPLETE | NONE
            LocalDateTime currentPeriodEnd,
            boolean cancelAtPeriodEnd
    ) {}
}

