package com.bookstore.orderservice.controller;

import com.bookstore.orderservice.dto.ApiResponse;
import com.bookstore.orderservice.dto.OrderDto.*;
import com.bookstore.orderservice.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders/store")
@RequiredArgsConstructor
public class StoreOrderController {

    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> getStoreOrders(@AuthenticationPrincipal Jwt jwt){

        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));

        List<OrderSummaryResponse> response = orderService.getStoreOrders(storeId);

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<StoreOrderResponse>> getStoreOrder(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID orderId
    ){
        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));

        StoreOrderResponse response = orderService.getStoreOrder(orderId, storeId);

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

    @GetMapping("/{storeId}/revenue")
    @PreAuthorize("hasRole('STORE_ADMIN') or hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<BigDecimal>> getStoreRevenue(@PathVariable UUID storeId){

        BigDecimal response = orderService.getStoreRevenue(storeId);

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

}
