package com.bookstore.orderservice.client;

import com.bookstore.orderservice.config.FeignClientConfig;
import com.bookstore.orderservice.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "STORE-SERVICE", configuration = FeignClientConfig.class)
public interface StoreClient {

    @GetMapping("/api/stores/{storeId}/stripe-account")
    ResponseEntity<ApiResponse<String>> getStripeAccountId(@PathVariable UUID storeId);

    @GetMapping("/api/stores/{storeId}/plan")
    ResponseEntity<ApiResponse<String>> getStorePlan(@PathVariable UUID storeId);

}
