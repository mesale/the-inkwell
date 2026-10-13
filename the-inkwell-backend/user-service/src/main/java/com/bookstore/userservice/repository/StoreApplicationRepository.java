package com.bookstore.userservice.repository;

import com.bookstore.userservice.entity.StoreApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreApplicationRepository extends JpaRepository<StoreApplication, UUID> {
    List<StoreApplication> findByUserId(UUID userId);
    Optional<StoreApplication> findByUserIdAndStatus(UUID userId, StoreApplication.Status status);

    boolean existsByUserIdAndStatus(UUID userId, StoreApplication.Status status);

    List<StoreApplication> findByStatus(StoreApplication.Status status);
}
