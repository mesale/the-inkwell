package com.bookstore.userservice.repository;

import com.bookstore.userservice.entity.StoreOwner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StoreOwnerRepository extends JpaRepository<StoreOwner, UUID> {

    boolean existsByStoreId(UUID storeId);
    boolean existsByUserId(UUID userId);

}
