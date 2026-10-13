package com.bookstore.paymentservice.repository;

import com.bookstore.paymentservice.entity.Payout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayoutRepository extends JpaRepository<Payout, UUID> {

    List<Payout> findByStoreId(UUID storeId);

    List<Payout> findByStoreIdAndStatus(UUID storeId, Payout.PayoutStatus status);

}
