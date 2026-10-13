package com.bookstore.userservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "store_owners", schema = "svc_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreOwner {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "store_id", nullable = false, unique = true)
    private UUID storeId;

}
