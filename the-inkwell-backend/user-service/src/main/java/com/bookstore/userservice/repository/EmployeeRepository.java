package com.bookstore.userservice.repository;

import com.bookstore.userservice.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    List<Employee> findByBranchId(UUID branchId);
    boolean existsByUserId(UUID userId);
}
