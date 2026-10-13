package com.bookstore.storeservice.event;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CreateStoreOwnerEvent {

    private UUID storeId;
    private String userKeycloakId;

}
