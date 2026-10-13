package com.bookstore.userservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreApplicationApprovedEvent {

    private UUID applicationId;
    private UUID userId;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private String businessEmail;
    private String storeName;
    private String businessRegNumber;
    private String tin;
    private String region;
    private String city;
    private String address;
    private String phone;
    private String bankName;
    private String bankAccount;
    private String ownerKeycloakId;
}
