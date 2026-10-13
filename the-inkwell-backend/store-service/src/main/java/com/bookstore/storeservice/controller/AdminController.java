package com.bookstore.storeservice.controller;

import com.bookstore.storeservice.dto.ApiResponse;
import com.bookstore.storeservice.dto.StoreDto.*;
import com.bookstore.storeservice.entity.Store;
import com.bookstore.storeservice.service.AdminStoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stores/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AdminController {

    private final AdminStoreService adminStoreService;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<StoreResponse>>> getPendingApplications() {
        return ResponseEntity.ok(ApiResponse.ok(
                adminStoreService.getStoresByStatus(Store.VerificationStatus.PENDING)));
    }

    @GetMapping("/awaiting-docs")
    public ResponseEntity<ApiResponse<List<StoreResponse>>> getAwaitingDocs() {
        return ResponseEntity.ok(ApiResponse.ok(
                adminStoreService.getStoresByStatus(Store.VerificationStatus.AWAITING_DOCS)));
    }

    @GetMapping("/docs-submitted")
    public ResponseEntity<ApiResponse<List<StoreResponse>>> getDocsSubmitted() {
        return ResponseEntity.ok(ApiResponse.ok(
                adminStoreService.getStoresByStatus(Store.VerificationStatus.DOCS_SUBMITTED)));
    }

    @PutMapping("/{storeId}/approve")
    public ResponseEntity<ApiResponse<StoreResponse>> approveStore(
            @PathVariable UUID storeId) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Store approved successfully",
                adminStoreService.approveStore(storeId)));
    }

    @PutMapping("/{storeId}/change-to-awaiting-docs")
    public ResponseEntity<ApiResponse<StoreResponse>> changeToAwaiting(@PathVariable UUID storeId){
        StoreResponse response =adminStoreService.changeToAwaiting(storeId);

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

    @PutMapping("/{storeId}/reject")
    public ResponseEntity<ApiResponse<StoreResponse>> rejectStore(
            @PathVariable UUID storeId,
            @Valid @RequestBody RejectStoreRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                "Store rejected",
                adminStoreService.rejectStore(storeId, request.reason())));
    }
}