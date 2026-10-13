package com.bookstore.userservice.controller;

import com.bookstore.userservice.dto.ApiResponse;
import com.bookstore.userservice.dto.StoreApplicationDto.*;
import com.bookstore.userservice.entity.StoreApplicationToken;
import com.bookstore.userservice.service.StoreApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users/me/store-application")
@RequiredArgsConstructor
@CrossOrigin
@Slf4j
public class StoreApplicationController {

    private final StoreApplicationService applicationService;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<String>> initiateApplication(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody InitiateApplicationRequest request
    ) {

        log.info("endpoint reached keycloakId: {}", jwt.getSubject());

        applicationService.initiateApplication(jwt.getSubject(), request.businessEmail());

        return ResponseEntity.ok(
                ApiResponse.ok("Application email sent. Please check your inbox.", null));
    }

    @GetMapping("/validate-token")
    public ResponseEntity<ApiResponse<TokenValidationResponse>> validateToken(
            @RequestParam String token
    ) {
        TokenValidationResponse response = applicationService.validateToken(token);

        if (!response.valid()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(response.message()));
        }

        return ResponseEntity.ok(ApiResponse.ok("Token is valid", response));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<StoreApplicationResponse>> submitApplication(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SubmitApplicationRequest request
    ){

        StoreApplicationResponse response = applicationService.submitApplication(jwt.getSubject(), request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Application Submitted successfully", response));

    }

    @GetMapping
    public ResponseEntity<ApiResponse<StoreApplicationResponse>> getMyApplication(@AuthenticationPrincipal Jwt jwt){

        StoreApplicationResponse response =applicationService.getMyApplication(jwt.getSubject());

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

}
