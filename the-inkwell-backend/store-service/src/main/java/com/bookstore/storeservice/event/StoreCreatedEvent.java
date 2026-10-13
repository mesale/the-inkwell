package com.bookstore.storeservice.event;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StoreCreatedEvent {

    private UUID storeId;
    private String businessEmail;
    private String storeName;

}
