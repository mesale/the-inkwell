package com.bookstore.orderservice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders", schema = "svc_order")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Order {

    public enum Status {PENDING, PAID, SHIPPED, DELIVERED, CANCELLED}

    public enum PaymentStatus {PENDING, COMPLETED, FAILED, REFUNDED}

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "buyer_keycloak_id", nullable = false)
    private String buyerKeycloakId;

    @Column(name = "branch_id", nullable = false)
    private UUID branchId;

    @Column(name = "store_id", nullable = false)
    private UUID storeId;

    @Column(name = "stripe_account_id")
    private String stripeAccountId;

    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status",nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "shipping_address", nullable = false)
    private String shippingAddress;

    @Column(name = "delivery_pin", length = 6)
    private String deliveryPin;

    @Column(name = "delivery_pin_used", nullable = false)
    private Boolean deliveryPinUsed = false;

    @Column(name = "delivery_pin_expiry")
    private LocalDateTime deliveryPinExpiry;

    @Column(name = "stripe_payment_id")
    private String stripePaymentId;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


}
