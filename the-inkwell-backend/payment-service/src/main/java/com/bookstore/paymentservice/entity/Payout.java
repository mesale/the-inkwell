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
@Table(name = "payouts", schema = "svc_payment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payout {

    public enum PayoutStatus {
        PENDING,
        COMPLETED,
        FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "stripe_transfer_id")
    private String stripeTransferId;

    @Column(name = "stripe_account_id")
    private String stripeAccountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PayoutStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

}
