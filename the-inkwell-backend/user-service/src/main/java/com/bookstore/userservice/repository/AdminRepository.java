package com.bookstore.userservice.repository;

import com.bookstore.userservice.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminRepository extends JpaRepository<Admin, UUID> {

    Optional<Admin> findByKeycloakId(String keycloakId);
    Optional<Admin> findByEmail(String email);

    boolean existsByKeycloakId(String keycloakId);
    boolean existsByEmail(String email);

}
