package com.bookstore.userservice.dto;

import com.bookstore.userservice.entity.StoreApplication;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.UUID;

public class StoreApplicationDto {

    public record InitiateApplicationRequest(
            @NotBlank(message = "business email is required")
            @Email(message = "invalid email")
            String businessEmail
    ){}

    public record SubmitApplicationRequest(
            @NotBlank(message = "business email is required")
            @Email(message = "invalid email")
            String businessEmail,
            UUID token,

            @NotBlank(message = "store name is required")
            String storeName,

            @NotBlank(message = "phone is required")
            String phone,

            @NotBlank(message = "address is required")
            String address,

            @NotBlank(message = "city is required")
            String city,

            String description
    ){}

    public record StoreApplicationResponse(
            UUID id,
            UUID userId,
            String businessEmail,
            String storeName,
            String phone,
            String address,
            String city,
            String description,
            String applicantName,
            String applicantEmail,
            StoreApplication.Status status,
            String rejectionReason,
            LocalDateTime submittedAt,
            LocalDateTime reviewedAt
    ){}
    public record TokenValidationResponse(
            boolean valid,
            String message,
            String email
    ){}

}
