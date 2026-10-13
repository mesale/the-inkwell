package com.bookstore.userservice.client;

import com.bookstore.userservice.config.FeignClientConfig;
import com.bookstore.userservice.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.UUID;

@FeignClient(name = "STORE-SERVICE", configuration = FeignClientConfig.class)
public interface StoreClient {

    @GetMapping("/api/stores/me/branch/{branchId}/exists")
    public ResponseEntity<ApiResponse<Boolean>> branchExists(
            @RequestParam UUID storeId,
            @PathVariable UUID branchId
    );

}
