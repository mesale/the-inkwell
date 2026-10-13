package com.bookstore.paymentservice.conttroller;

import com.bookstore.paymentservice.dto.ApiResponse;
import com.bookstore.paymentservice.dto.PaymentDto.*;
import com.bookstore.paymentservice.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {

    private final PaymentService paymentService;

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getTransactions(){

        List<TransactionResponse> response = paymentService.getAllTransactions();

        return ResponseEntity.ok(ApiResponse.ok(response));

    }

}
