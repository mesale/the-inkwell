package com.bookstore.bookservice.controller;

import com.bookstore.bookservice.dto.ApiResponse;
import com.bookstore.bookservice.dto.BookDto.*;
import com.bookstore.bookservice.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/books/store")
public class StoreBookController {

    private final BookService bookService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, value = {"/branch/{branchId}"})
    @PreAuthorize("hasRole('STORE_ADMIN') or  hasRole('WORKER') or hasRole('BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<BookResponse>> createBook(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestPart("data") CreateBookRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @PathVariable UUID branchId
            ){
        String keycloakId = jwt.getSubject();
        String role = extractRole(jwt);
        BookResponse response;

        if (role.equals("ROLE_STORE_ADMIN")){
            if (jwt.getClaim("store_id") == null)
                throw new RuntimeException("store_id claim is null");
            UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
            response = bookService.createBookAsOwner(keycloakId, storeId, branchId, request, image);
        } else {
            branchId = UUID.fromString(jwt.getClaim("branch_id"));
            UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
            response = bookService.createBookAsEmployee(keycloakId, branchId, storeId, request, image);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Book created successfully", response));

    }

//    @PostMapping(value = "/{branchId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    @PreAuthorize("hasRole('STORE_ADMIN')")
//    public ResponseEntity<ApiResponse<BookResponse>> createBookForBranch(
//            @AuthenticationPrincipal Jwt jwt,
//            @PathVariable UUID branchId,
//            @Valid @RequestPart("data") CreateBookRequest request,
//            @RequestPart(value = "image", required = false) MultipartFile image
//    ){
//        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
//        BookResponse response = bookService.createBookForBranch(storeId, branchId, request, image);
//        return ResponseEntity.status(HttpStatus.CREATED)
//                .body(ApiResponse.ok("Book created for branch successfully", response));
//    }




    @PutMapping(value = "/{bookId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STORE_ADMIN') or hasRole('WORKER') or hasRole('BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<BookResponse>> updateBook(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID bookId,
            @Valid @RequestPart("data") UpdateBookRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image
    ){
            String keycloakId = jwt.getSubject();
            String role = extractRole(jwt);
            BookResponse response;

            if (role.equals("ROLE_STORE_ADMIN")){
                UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
                response = bookService.updateBookAsOwner(keycloakId, storeId, bookId, request,image);
            }else{
                UUID branchId = UUID.fromString(jwt.getClaim("branch_id"));
                response = bookService.updateBookAsEmployee(keycloakId, branchId, bookId, request, image);
            }

            return ResponseEntity.ok(ApiResponse.ok("Book updated successfully", response));
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<ApiResponse<Void>> deleteBook(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID bookId
    ){
        String role = extractRole(jwt);

        if(role.equals("ROLE_STORE_ADMIN")){
            UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
            bookService.deleteBookAsOwner(jwt.getSubject(), storeId, bookId);
        }else{
            UUID branchId = UUID.fromString(jwt.getClaim("branch_id"));
            bookService.deleteBookAsEmployee( branchId, bookId);
        }

        return ResponseEntity.ok(ApiResponse.ok("Book deleted", null));
    }
    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasRole('STORE_ADMIN') or hasRole('WORKER')")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getBranchBooks(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID branchId
    ){

        String role = extractRole(jwt);

        if(role.equals("WORKER") ||role.equals("BRANCH_MANAGER"))
            branchId = UUID.fromString(jwt.getClaim("branch_id"));

        List<BookResponse> response = bookService.getBranchBooks(branchId);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/branch/{branchId}/count")
    @PreAuthorize("hasRole('STORE_ADMIN') or hasRole('WORKER')")
    public ResponseEntity<ApiResponse<Long>> getBranchBooksCount(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID branchId){

        if (extractRole(jwt).equals("WORKER")) branchId = UUID.fromString(jwt.getClaim("branch_id"));

        long response = bookService.getBranchBooksCount(branchId);

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

    @GetMapping("/my-store")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<List<BookResponse>>> getStoreBooks(@AuthenticationPrincipal Jwt jwt){
        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
        List<BookResponse> responses = bookService.getStoreBooks(storeId);

        return ResponseEntity.ok(ApiResponse.ok(responses));

    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<Page<BookResponse>>> getPendingBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ){
        Pageable pageable = PageRequest.of(page, size);

        Page<BookResponse> response = bookService.getUnapprovedBooksForStore(pageable);

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

    @PutMapping("/{bookId}/approve")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<BookResponse>> approveBook(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID bookId
    ){
        UUID storeId =UUID.fromString(jwt.getClaim("store_id"));
        BookResponse response = bookService.approveBookAsOwner(storeId, bookId);

        return ResponseEntity.ok(ApiResponse.ok("Book approved", response));
    }

    @DeleteMapping("/{bookId}/reject")
    @PreAuthorize("hasRole('STORE_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> rejectBook(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID bookId
    ){

        UUID storeId = UUID.fromString(jwt.getClaim("store_id"));
        bookService.rejectBookAsOwner(storeId, bookId);

        return ResponseEntity.ok(ApiResponse.ok("Book rejected", null));
    }
    private String extractRole(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        Collection<String> roles = (Collection<String>) realmAccess.get("roles");
        if (roles.contains("ROLE_STORE_ADMIN")) return "ROLE_STORE_ADMIN";
        return "ROLE_EMPLOYEE";
    }

}
