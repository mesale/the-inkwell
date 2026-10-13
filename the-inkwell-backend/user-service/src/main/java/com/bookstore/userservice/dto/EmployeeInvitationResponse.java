package com.bookstore.userservice.dto;

import java.util.UUID;

public record EmployeeInvitationResponse(
    UUID storeId,
    UUID branchId,
    String role,
    String status
) {}
