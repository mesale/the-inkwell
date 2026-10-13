package com.bookstore.paymentservice.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class StripeConfig {

    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

//    @Value("${stripe.client-id}")
//    private String clientId;

    @PostConstruct
    public void init(){
        Stripe.apiKey = secretKey;
    }

}
