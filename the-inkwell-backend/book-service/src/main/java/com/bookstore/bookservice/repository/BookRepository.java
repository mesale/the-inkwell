package com.bookstore.bookservice.repository;

import com.bookstore.bookservice.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookRepository extends JpaRepository<Book, UUID> {

    @EntityGraph(attributePaths = {"documents"})
    Page<Book> findByApprovedTrue(Pageable pageable);

    Page<Book> findByApprovedTrueAndCategory(String category, Pageable pageable);

    Page<Book> findByApprovedTrueAndTitleContainingIgnoreCase(String title, Pageable pageable);


    List<Book> findByBranchId(UUID branchId);

    List<Book> findByStoreId(UUID storeId);

    Page<Book> findByBranchIdAndApprovedTrue(UUID branchId, Pageable pageable);

    long countByBranchId(UUID branchId);

    Page<Book> findByApprovedFalse(Pageable pageable);

    Optional<Book> findByIdAndBranchId(UUID id, UUID branchId);

    Optional<Book> findByIdAndStoreId(UUID id, UUID storeId);


}
