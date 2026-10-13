package com.bookstore.bookservice.controller;

import com.bookstore.bookservice.dto.ApiResponse;
import com.bookstore.bookservice.dto.BookDto.*;
import com.bookstore.bookservice.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/books")
public class AdminBookController {

    private final BookService bookService;

    @PutMapping("/{bookId}/remove")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeBook(@PathVariable UUID bookId){
        bookService.removeBookAsAdmin(bookId);
        return ResponseEntity.ok(ApiResponse.ok("Book removed", null));
    }

}
