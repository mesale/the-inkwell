package com.bookstore.paymentservice.repository;

import com.bookstore.paymentservice.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    Optional<Transaction> findByOrderId(UUID orderId);

    Optional<Transaction> findByOrderIdAndBuyerKeycloakId(UUID orderId, String buyerKeycloakId);

    Optional<Transaction> findByStripePaymentIntentId(String stripePaymentIntentId);

    List<Transaction> findByStoreId(UUID storeId);

    List<Transaction> findByBuyerKeycloakId(String buyerKeycloakId);

    List<Transaction> findByStoreIdAndStatus(UUID storeId, Transaction.TransactionStatus status);

}
