package com.bookstore.storeservice.repository;

import com.bookstore.storeservice.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreRepository extends JpaRepository<Store, UUID> {
    Optional<Store> findByEmail(String email);

    Optional<Store> findByStripeAccountId(String stripeAccountId);

    List<Store> findByVerificationStatus(Store.VerificationStatus status);

    boolean existsByEmail(String email);

    boolean existsByBusinessRegNumber(String businessRegNumber);

    boolean existsByTin(String tin);

}
