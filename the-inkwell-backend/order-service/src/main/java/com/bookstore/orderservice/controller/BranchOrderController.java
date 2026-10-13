    package com.bookstore.orderservice.controller;

    import com.bookstore.orderservice.dto.ApiResponse;
    import com.bookstore.orderservice.dto.OrderDto.*;
    import com.bookstore.orderservice.service.OrderService;
    import jakarta.validation.Valid;
    import lombok.RequiredArgsConstructor;
    import org.springframework.http.ResponseEntity;
    import org.springframework.security.access.prepost.PreAuthorize;
    import org.springframework.security.core.annotation.AuthenticationPrincipal;
    import org.springframework.security.oauth2.jwt.Jwt;
    import org.springframework.web.bind.annotation.*;

    import java.util.Collection;
    import java.util.List;
    import java.util.Map;
    import java.util.UUID;

    @RestController
    @RequestMapping("/api/orders/branch")
    @RequiredArgsConstructor
    public class BranchOrderController {

        private final OrderService orderService;

        @GetMapping
        @PreAuthorize("hasRole('STORE_ADMIN') or hasRole('WORKER')")
        public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> getBranchOrders(
                @AuthenticationPrincipal Jwt jwt
                ){

            UUID branchId = UUID.fromString(jwt.getClaim("branch_id"));

            List<OrderSummaryResponse> response = orderService.getBranchOrders(branchId);

            return ResponseEntity.ok(ApiResponse.ok(response));

        }

        @GetMapping("/{branchId}/count")
        @PreAuthorize("hasRole('STORE_ADMIN') or hasRole('WORKER')")
        public ResponseEntity<ApiResponse<Long>> getBranchOrdersCount(
                @AuthenticationPrincipal Jwt jwt,
                @PathVariable UUID branchId){

            if (extractRole(jwt).equals("WORKER")) branchId = UUID.fromString(jwt.getClaim("branch_id"));

            long response = orderService.getBranchOrdersCount(branchId);

            return ResponseEntity.ok(ApiResponse.ok(response));

        }

        @GetMapping("/pending")
        @PreAuthorize("hasRole('STORE_ADMIN') or hasRole('EMPLOYEE')")
        public ResponseEntity<ApiResponse<List<OrderSummaryResponse>>> getPendingOrders(@AuthenticationPrincipal Jwt jwt){

            UUID branchId = UUID.fromString(jwt.getClaim("branch_id"));

            List<OrderSummaryResponse> response = orderService.getPendingBranchOrders(branchId);

            return ResponseEntity.ok(ApiResponse.ok(response));

        }

        @PostMapping("/confirm-delivery")
        @PreAuthorize("hasRole('STORE_ADMIN') or hasRole('WORKER')")
        public ResponseEntity<ApiResponse<OrderResponse>> confirmDelivery(
                @AuthenticationPrincipal Jwt jwt,
                @Valid @RequestBody ConfirmDeliveryRequest request
        ){

            UUID branchId = UUID.fromString(jwt.getClaim("branch_id"));
            OrderResponse response = orderService.confirmDelivery(branchId, request);

            return ResponseEntity.ok(ApiResponse.ok("Delivery Confirmed successfully", response));

        }

        private String extractRole(Jwt jwt) {
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            Collection<String> roles = (Collection<String>) realmAccess.get("roles");
            if (roles.contains("ROLE_STORE_ADMIN")) return "ROLE_STORE_ADMIN";
            return "ROLE_EMPLOYEE";
        }

    }
