package com.bookstore.bookservice.controller;

import com.bookstore.bookservice.dto.ApiResponse;
import com.bookstore.bookservice.dto.BookDto.*;
import com.bookstore.bookservice.service.BookService;
import lombok.RequiredArgsConstructor;
import org.checkerframework.checker.units.qual.A;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/books")
public class PublicBookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BookSummaryResponse>>> getBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ){
        Sort sort = sortDir.equalsIgnoreCase("asc") ?
                Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<BookSummaryResponse> responses = bookService.getApprovedBooks(pageable);

        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @GetMapping("{bookId}")
    public ResponseEntity<ApiResponse<BookResponse>> getBook(@PathVariable UUID bookId){

        BookResponse response = bookService.getBookById(bookId);

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<BookSummaryResponse>>> searchBooks(
            @RequestParam String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ){
        Pageable pageable = PageRequest.of(page, size);

        Page<BookSummaryResponse> responses = bookService.searchBooks(title, pageable);

        return ResponseEntity.ok(ApiResponse.ok(responses));

    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<Page<BookSummaryResponse>>> getBooksByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ){
        Pageable pageable = PageRequest.of(page, size);

        Page<BookSummaryResponse> response = bookService.getApprovedBooksByCategory(category, pageable);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

}
