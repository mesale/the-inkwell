package com.bookstore.paymentservice.client;

import com.bookstore.paymentservice.config.FeignClientConfig;
import com.bookstore.paymentservice.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "STORE-SERVICE", configuration = FeignClientConfig.class)
public interface StoreClient {

    @GetMapping("/api/stores/{storeId}/stripe-account")
    public ResponseEntity<ApiResponse<String>> getStripeAccountId(@PathVariable UUID storeId);
    @GetMapping("/api/stores/{storeId}/email")
    public ResponseEntity<ApiResponse<String>> getStoreEmail(@PathVariable UUID storeId);

}
