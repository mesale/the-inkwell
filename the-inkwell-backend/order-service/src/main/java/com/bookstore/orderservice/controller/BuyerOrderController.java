package com.bookstore.orderservice.controller;

import com.bookstore.orderservice.dto.ApiResponse;
import com.bookstore.orderservice.dto.OrderDto.*;
import com.bookstore.orderservice.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class BuyerOrderController {

    private final OrderService orderService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody CreateOrderRequest request
    ){

      OrderResponse response = orderService.createOrder(jwt.getSubject(), request);

      return ResponseEntity.status(HttpStatus.CREATED)
              .body(ApiResponse.ok("Order created successfully", response));

    }

    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> getMyOrders(
            @AuthenticationPrincipal Jwt jwt
    ){

        List<OrderSummaryResponse> response = orderService.getMyOrders(jwt.getSubject());

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<OrderResponse>> getMyOrder(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID orderId
    ){

        OrderResponse response = orderService.getMyOrder(orderId, jwt.getSubject());

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

}
