package com.bookstore.notificationservice.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StoreApplicationEmailEvent {
    private String toEmail;
    private String applicantName;
    private String token;
}
