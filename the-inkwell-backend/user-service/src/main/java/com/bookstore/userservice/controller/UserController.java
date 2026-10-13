package com.bookstore.userservice.controller;

import com.bookstore.userservice.dto.ApiResponse;
import com.bookstore.userservice.dto.UserDto.*;
import com.bookstore.userservice.service.UserService;
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
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterUserRequest request){
       UserResponse response =  userService.registerUser(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User registered successfully", response));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestParam String email){
        userService.forgotPassword(email);
        return ResponseEntity.ok(ApiResponse.ok("Password reset email sent", null));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(@AuthenticationPrincipal Jwt jwt){

        UserResponse response = userService.getByKeycloakId(jwt.getSubject());

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/me")
//    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<UserResponse>> userProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request
    ){

        UserResponse response = userService.updateUser(jwt.getSubject(), request);

        return ResponseEntity.ok(ApiResponse.ok("Profile Updated Successfully", response));
    }

    @PostMapping("/stores/me/branch/{branchId}/employees")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> addEmployee(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID branchId,
            @RequestBody EmployeeRequest request
    ){

        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));

        UserResponse response = userService.addEmployee(storeId, branchId, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Employee invitation sent", response));

    }
    
    @GetMapping("/invitations/{token}")
    public ResponseEntity<ApiResponse<com.bookstore.userservice.dto.EmployeeInvitationResponse>> getInvitationDetails(
            @PathVariable String token
    ){
        com.bookstore.userservice.dto.EmployeeInvitationResponse response = userService.getInvitationDetails(token);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
    
    @PostMapping("/invitations/{token}/confirm")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<UserResponse>> confirmInvitation(
            @PathVariable String token
    ){
        UserResponse response = userService.confirmEmployeeInvitation(token);
        return ResponseEntity.ok(ApiResponse.ok("Invitation confirmed successfully", response));
    }

    @GetMapping("/stores/me/branch/{branchId}/employees")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getEmployees(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID branchId
    ){

        List<UserResponse> responses = userService.getEmployees(branchId);

        return ResponseEntity.ok(ApiResponse.ok(responses));

    }

}
