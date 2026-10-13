package com.bookstore.bookservice.dto;

import com.bookstore.bookservice.entity.Book;
import com.bookstore.bookservice.entity.Document;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class BookDto {

    public record CreateBookRequest(
            @NotBlank(message = "Title is required")
            String title,

            @NotBlank(message = "Author is required")
            String author,

            String description,

            @NotBlank(message = "Category is required")
            String category,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.01", message = "Price must be greater than 0")
            BigDecimal price,

            @NotNull(message = "Condition is required")
            Book.Condition condition

    ){}

    public record UpdateBookRequest(

            @NotBlank(message = "Title is required")
            String title,

            @NotBlank(message = "Author is required")
            String author,

            String description,

            @NotBlank(message = "Category is required")
            String category,

            @NotNull(message = "Price is required")
            @DecimalMin(value = "0.01", message = "Price must be greater than 0")
            BigDecimal price,

            @NotNull(message = "Condition is required")
            Book.Condition condition
    ){}

    public record   BookResponse(
            UUID id,
            UUID createdBy,
            UUID branchId,
            UUID storeId,
            String title,
            String author,
            String description,
            String category,
            BigDecimal price,
            List<DocumentResponse> documents,
            String condition,
            Boolean approved,
            LocalDateTime createdAt
    ){}

    public record DocumentResponse(
            UUID id,
            Document.DocumentType documentType,
            String url,
            String fileName,
            UUID uploadedBy


    ){}

    public record BookSummaryResponse(
            UUID id,
            UUID branchId,
            String title,
            String author,
            String category,
            BigDecimal price,
            String condition,
            List<DocumentResponse> documents
    ) {}

    public record UploadResult(
            String fileName,
            String contentType,
            long size,
            String objectKey,
            String bucketName
    ) {}

}
