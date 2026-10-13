package com.bookstore.userservice.event;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class KafkaTopics {

    public static final String STORE_APPLICATION_APPROVED = "store-application-approved";
    public static final String STORE_APPLICATION_EMAIL = "store-application-email";
    public static final String CREATE_STORE_OWNER = "create-store-owner";
    public static final String EMPLOYEE_INVITATION_EMAIL = "employee-invitation-email";

}
