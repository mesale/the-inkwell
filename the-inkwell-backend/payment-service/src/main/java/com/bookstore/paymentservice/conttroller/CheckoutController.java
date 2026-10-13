package com.bookstore.paymentservice.conttroller;

import com.bookstore.paymentservice.dto.ApiResponse;
import com.bookstore.paymentservice.dto.PaymentDto.*;
import com.bookstore.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class CheckoutController {

    private final PaymentService paymentService;

    @PostMapping("/checkout/{orderId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<CheckoutResponse>> createCheckout(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID orderId
    ){

        CheckoutResponse response = paymentService.createCheckoutSession(orderId, jwt.getSubject());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Checkout session created", response));

    }

    @PostMapping("/refund/{orderId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<RefundResponse>> requestRefund(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID orderId
    ) {
        RefundResponse response = paymentService.requestRefund(orderId, jwt.getSubject());
        return ResponseEntity.ok(ApiResponse.ok("Refund issued successfully", response));
    }

}

