package com.bookstore.userservice.dto;

import com.bookstore.userservice.entity.Employee;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserDto {
    public record UserResponse(
            UUID id,
            String keycloakId,
            String name,
            String email,
            String phone,
            LocalDateTime createdAt
    ){}

    public record UpdateProfileRequest(
            @NotBlank(message = "Name is required")
            @Size(min = 2, max = 255, message = "Name must be between 2 and 255")
            String name,

            @Size(max = 20, message = "Phone number must be below 20")
            String phone
    ){}

    public record RegisterUserRequest(

            @NotBlank(message = "Name is required")
            @Size(min = 2, max = 255, message = "Name must be between 2 and 255")
            String name,

            @NotBlank(message = "Emain is required")
            @Email(message = "Invalid email")
            String email,

            @NotBlank(message = "password is required")
            @Size(min = 8, message = "Password must be greater or equal to 8 characters")
            String password,

            @Size(max = 20, message = "Phone number must be below 20")
            String phone
    ){}

    public record EmployeeRequest(
            String email,
            Employee.Role role
    ){}

}
