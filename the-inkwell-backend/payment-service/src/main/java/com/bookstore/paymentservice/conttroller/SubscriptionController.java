package com.bookstore.paymentservice.conttroller;

import com.bookstore.paymentservice.dto.ApiResponse;
import com.bookstore.paymentservice.dto.PaymentDto.*;
import com.bookstore.paymentservice.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments/subscription")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    /**
     * GET /api/payments/subscription/status
     * Returns the current subscription status for the authenticated store.
     */
    @GetMapping("/status")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> getStatus(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID storeId = UUID.fromString(jwt.getClaimAsString("store_id"));
        SubscriptionStatusResponse response = subscriptionService.getSubscriptionStatus(storeId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * POST /api/payments/subscription/setup
     * Creates a Stripe SetupIntent so the frontend can collect card details.
     * Returns { setupIntentClientSecret, stripeCustomerId, priceId }.
     */
    @PostMapping("/setup")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<SubscribeSetupResponse>> setupSubscription(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID storeId = UUID.fromString(jwt.getClaimAsString("store_id"));
        SubscribeSetupResponse response = subscriptionService.createSubscriptionSetup(storeId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Setup ready", response));
    }

    /**
     * POST /api/payments/subscription/confirm
     * After the frontend confirms the SetupIntent, call this with the paymentMethodId
     * to create the actual Stripe Subscription.
     */
    @PostMapping("/confirm")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<SubscribeConfirmResponse>> confirmSubscription(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody SubscribeConfirmRequest request
    ) {
        UUID storeId = UUID.fromString(jwt.getClaimAsString("store_id"));
        SubscribeConfirmResponse response =
                subscriptionService.confirmSubscription(storeId, request.paymentMethodId());
        return ResponseEntity.ok(ApiResponse.ok("Subscription activated", response));
    }

    /**
     * DELETE /api/payments/subscription/cancel
     * Cancels the store's premium subscription at period end.
     */
    @DeleteMapping("/cancel")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> cancelSubscription(
            @AuthenticationPrincipal Jwt jwt
    ) {
        UUID storeId = UUID.fromString(jwt.getClaimAsString("store_id"));
        SubscriptionStatusResponse response = subscriptionService.cancelSubscription(storeId);
        return ResponseEntity.ok(ApiResponse.ok("Subscription will cancel at period end", response));
    }
}
