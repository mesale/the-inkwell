package com.bookstore.userservice.controller;

import com.bookstore.userservice.dto.ApiResponse;
import com.bookstore.userservice.dto.StoreApplicationDto.*;
import com.bookstore.userservice.service.StoreApplicationService;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.shaded.com.google.protobuf.Api;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/admin")
@RequiredArgsConstructor
public class AdminController {

    private final StoreApplicationService applicationService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StoreApplicationResponse>>> getPendingApplications(){

        List<StoreApplicationResponse> response = applicationService.getAllPending();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/store-applications/{applicationId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StoreApplicationResponse>> approveApplication(@PathVariable UUID applicationId){

        StoreApplicationResponse response = applicationService.approveApplication(applicationId);

        return ResponseEntity.ok(ApiResponse.ok("Application Approved Successfully",response));

    }

    @PutMapping("/store-applications/{applicationId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StoreApplicationResponse>> rejectApplication(
            @PathVariable UUID applicationId,
            @RequestParam String reason
    ){

        StoreApplicationResponse response =applicationService.rejectApplication(applicationId, reason);

        return ResponseEntity.ok(ApiResponse.ok("Application Rejected", response));

    }

}
