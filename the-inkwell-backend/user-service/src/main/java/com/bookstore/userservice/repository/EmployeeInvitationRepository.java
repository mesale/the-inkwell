package com.bookstore.userservice.repository;

import com.bookstore.userservice.entity.EmployeeInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeInvitationRepository extends JpaRepository<EmployeeInvitation, UUID> {
    Optional<EmployeeInvitation> findByToken(String token);
    Optional<EmployeeInvitation> findByUserIdAndStoreIdAndStatus(UUID userId, UUID storeId, String status);
}
