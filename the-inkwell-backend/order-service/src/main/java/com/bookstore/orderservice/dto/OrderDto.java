package com.bookstore.orderservice.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class OrderDto {

    public record CreateOrderRequest(

            @NotNull(message = "Branch ID is required")
            UUID branchId,

            @NotNull(message = "Store ID is required")
            UUID storeId,

//            @NotBlank(message = "Stripe account ID is required")
//            String stripeAccountId,

            @NotBlank(message = "Shipping address is required")
            String shippingAddress,

            @NotEmpty(message = "Order must have at least one item")
            List<OrderItemRequest> items
    ) {}

    public record OrderItemRequest(

            @NotNull(message = "Book ID is required")
            UUID bookId,

            @NotNull(message = "Quantity is required")
            @Min(value = 1, message = "Quantity must be at least 1")
            Integer quantity,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.01", message = "Price must be greater than 0")
            BigDecimal price
    ) {}

    public record OrderResponse(
            UUID id,
            String buyerKeycloakId,
            UUID branchId,
            UUID storeId,
            BigDecimal totalPrice,
            String status,
            String paymentStatus,
            String shippingAddress,
            String deliveryPin,
            Boolean deliveryPinUsed,
            String stripePaymentId,
            List<OrderItemResponse> items,
            LocalDateTime createdAt
    ) {}

    public record StoreOrderResponse(
            UUID id,
            String buyerKeycloakId,
            UUID branchId,
            UUID storeId,
            BigDecimal totalPrice,
            String status,
            String paymentStatus,
            String shippingAddress,
            List<OrderItemResponse> items,
            LocalDateTime createdAt
    ) {}

    public record OrderItemResponse(
            UUID id,
            UUID bookId,
            Integer quantity,
            BigDecimal price
    ) {}

    public record ConfirmDeliveryRequest(

            @NotBlank(message = "PIN is required")
            @Size(min = 6, max = 6, message = "PIN must be exactly 6 digits")
            String pin
    ) {}

    public record OrderSummaryResponse(
            UUID id,
            UUID branchId,
            BigDecimal totalPrice,
            String status,
            String paymentStatus,
            LocalDateTime createdAt
    ) {}
}
