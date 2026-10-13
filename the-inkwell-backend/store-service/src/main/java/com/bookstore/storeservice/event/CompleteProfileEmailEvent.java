package com.bookstore.storeservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CompleteProfileEmailEvent {
    private String toEmail;
    private String storeName;
}
