package com.bookstore.orderservice.repository;

import com.bookstore.orderservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByBuyerKeycloakId(String buyerKeycloakId);

    List<Order> findByBranchId(UUID branchId);

    long countByBranchId(UUID branchId);

    List<Order> findByBranchIdAndStatus(UUID branchId, Order.Status status);

    List<Order> findByStoreId(UUID storeId);

    List<Order> findByStoreIdAndStatus(UUID storeId, Order.Status status);

    Optional<Order> findByIdAndBuyerKeycloakId(UUID orderId, String buyerKeycloakId);

    Optional<Order> findByIdAndBranchId(UUID orderId, UUID branchId);

    @Query("""
    SELECT COALESCE(SUM(o.totalPrice), 0)
    FROM Order o
    WHERE o.storeId = :storeId
      AND o.status = 'DELIVERED'
""")
    BigDecimal calculateRevenue(UUID storeId);

    Optional<Order> findByIdAndStoreId(UUID orderId, UUID storeId);

    Optional<Order> findByDeliveryPin(String deliveryPin);

}
