package com.bookstore.storeservice.repository;

import com.bookstore.storeservice.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {

    List<Branch> findByStoreId(UUID storeId);

    Optional<Branch> findByIdAndStoreId(UUID id, UUID storeID);

    boolean existsByBranchNameAndStoreId(String name, UUID storeId);

    boolean existsByIdAndStoreId(UUID branchId, UUID storeId);

}
