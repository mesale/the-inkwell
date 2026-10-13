package com.bookstore.paymentservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions", schema = "svc_payment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    public enum TransactionStatus {
        PENDING,
        HELD,
        RELEASED,
        REFUNDED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "buyer_keycloak_id", nullable = false)
    private String buyerKeycloakId;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "stripe_account_id")
    private String stripeAccountId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "commission_rate", nullable = false)
    private BigDecimal commissionRate;

    @Column(name = "commission_amount", nullable = false)
    private BigDecimal commissionAmount;

    @Column(name = "net_amount", nullable = false)
    private BigDecimal netAmount;

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

}
