package com.bookstore.paymentservice.conttroller;

import com.bookstore.paymentservice.client.StoreClient;
import com.bookstore.paymentservice.dto.ApiResponse;
import com.bookstore.paymentservice.dto.PaymentDto.*;
import com.bookstore.paymentservice.exception.ConflictException;
import com.bookstore.paymentservice.service.PaymentService;
import com.bookstore.paymentservice.service.StripeOnboardingService;
import com.stripe.exception.StripeException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments/store")
public class StorePaymentController {

    private final PaymentService paymentService;
    private final StripeOnboardingService stripeOnboardingService;

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getStoreTransactions(@AuthenticationPrincipal Jwt jwt){

        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));

        List<TransactionResponse> response = paymentService.getStoreTransactions(storeId);

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

    @GetMapping("/payouts")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<List<PayoutResponse>>> getStorePayouts(@AuthenticationPrincipal Jwt jwt){

        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));

        List<PayoutResponse> response = paymentService.getStorePayouts(storeId);

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

    @GetMapping("/onboarding-link")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<String>> refreshUrl(@AuthenticationPrincipal Jwt jwt) throws StripeException {

        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
       String stripeAccountId = stripeOnboardingService.getStripeAccountId(storeId);
       String url = stripeOnboardingService.createAccountLink(stripeAccountId);
       stripeOnboardingService.sendOnboardingEmail(url, storeId);

        return ResponseEntity.ok(ApiResponse.ok(url));
    }

    @PostMapping("/dashboard-link")
    public ResponseEntity<ApiResponse<String>> getDashboardLink(@AuthenticationPrincipal Jwt jwt) throws StripeException {
        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
        String stripeAccountId = stripeOnboardingService.getStripeAccountId(storeId);
        String url = stripeOnboardingService.createLoginLink(stripeAccountId);
        return ResponseEntity.ok(ApiResponse.ok(url));
    }

    @GetMapping("/onboarding-status")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> getOnboardingStatus(@AuthenticationPrincipal Jwt jwt) throws StripeException {
        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
        boolean complete = stripeOnboardingService.refreshOnboardingStatus(storeId);
        return ResponseEntity.ok(ApiResponse.ok(complete));
    }

    @GetMapping("/completed")
    public ResponseEntity<ApiResponse<String>> returnUrl(){
        return ResponseEntity.ok(ApiResponse.ok("Session completed"));
    }



}
