package com.bookstore.userservice.repository;

import com.bookstore.userservice.entity.StoreApplicationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreApplicationTokenRepository
        extends JpaRepository<StoreApplicationToken, UUID> {

    Optional<StoreApplicationToken> findByToken(UUID token);

    Optional<StoreApplicationToken> findByTokenAndUsedFalse(UUID token);
}
