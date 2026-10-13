package com.bookstore.storeservice.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.UUID;

public class BranchDto {

    public record CreateBranchRequest(

            @NotBlank(message = "Branch name is required")
            String branchName,

            @NotBlank(message = "Region is required")
            String region,

            @NotBlank(message = "City is required")
            String city,

            @NotBlank(message = "Address is required")
            String address,

            String phone
    ) {}

    public record BranchResponse(
            UUID id,
            UUID storeId,
            String branchName,
            String region,
            String city,
            String address,
            String phone,
            LocalDateTime createdAt
    ) {}

    public record UpdateBranchRequest(

            @NotBlank(message = "Branch name is required")
            String branchName,

            @NotBlank(message = "Region is required")
            String region,

            @NotBlank(message = "City is required")
            String city,

            @NotBlank(message = "Address is required")
            String address,

            String phone
    ) {}
}
