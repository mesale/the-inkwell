package com.bookstore.paymentservice.conttroller;

import com.bookstore.paymentservice.config.StripeConfig;
import com.bookstore.paymentservice.dto.ApiResponse;
import com.bookstore.paymentservice.service.PaymentService;
import com.bookstore.paymentservice.service.StripeOnboardingService;
import com.bookstore.paymentservice.service.SubscriptionService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Account;
import com.stripe.model.Event;
import com.stripe.model.Invoice;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments/webhook")
@Slf4j
public class StripeWebhookController {

    private final PaymentService paymentService;
    private final StripeConfig stripeConfig;
    private final StripeOnboardingService stripeOnboardingService;
    private final SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> handleWebhook(
            @RequestBody byte[] payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;

        try {
            event = Webhook.constructEvent(
                    new String(payload, StandardCharsets.UTF_8),
                    sigHeader,
                    stripeConfig.getWebhookSecret());
        } catch (SignatureVerificationException e) {
            log.warn("Invalid stripe webhook signature: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.ok("Invalid signature"));
        }

        switch (event.getType()) {

            case "payment_intent.succeeded" -> {
                log.info("Handling payment_intent.succeeded");
                var d1 = event.getDataObjectDeserializer();
                try {
                    PaymentIntent pi = d1.getObject().isPresent()
                            ? (PaymentIntent) d1.getObject().get()
                            : (PaymentIntent) d1.deserializeUnsafe();
                    log.info("PaymentIntent succeeded: {}", pi.getId());
                    paymentService.handleStripeWebhook(pi.getId());
                } catch (Exception e) {
                    log.error("Failed to deserialize PaymentIntent: {}", e.getMessage());
                }
            }

            case "account.updated" -> {
                log.info("Handling account.updated");
                var d2 = event.getDataObjectDeserializer();
                try {
                    Account account = d2.getObject().isPresent()
                            ? (Account) d2.getObject().get()
                            : (Account) d2.deserializeUnsafe();
                    log.info("Account updated: {}", account.getId());
                    stripeOnboardingService.handleAccountUpdated(account);
                } catch (Exception e) {
                    log.error("Failed to deserialize Account: {}", e.getMessage());
                }
            }

            case "customer.subscription.updated" -> {
                log.info("Handling customer.subscription.updated");
                var d3 = event.getDataObjectDeserializer();
                try {
                    com.stripe.model.Subscription sub = d3.getObject().isPresent()
                            ? (com.stripe.model.Subscription) d3.getObject().get()
                            : (com.stripe.model.Subscription) d3.deserializeUnsafe();
                    subscriptionService.handleSubscriptionUpdated(sub);
                } catch (Exception e) {
                    log.error("Failed to handle customer.subscription.updated: {}", e.getMessage());
                }
            }

            case "customer.subscription.deleted" -> {
                log.info("Handling customer.subscription.deleted");
                var d4 = event.getDataObjectDeserializer();
                try {
                    com.stripe.model.Subscription sub = d4.getObject().isPresent()
                            ? (com.stripe.model.Subscription) d4.getObject().get()
                            : (com.stripe.model.Subscription) d4.deserializeUnsafe();
                    subscriptionService.handleSubscriptionDeleted(sub);
                } catch (Exception e) {
                    log.error("Failed to handle customer.subscription.deleted: {}", e.getMessage());
                }
            }

            case "invoice.payment_succeeded" -> {
                log.info("Handling invoice.payment_succeeded");
                var d5 = event.getDataObjectDeserializer();
                try {
                    Invoice invoice = d5.getObject().isPresent()
                            ? (Invoice) d5.getObject().get()
                            : (Invoice) d5.deserializeUnsafe();
                    subscriptionService.handleInvoicePaymentSucceeded(invoice);
                } catch (Exception e) {
                    log.error("Failed to handle invoice.payment_succeeded: {}", e.getMessage());
                }
            }

            default -> log.info("Unhandled stripe event type: {}", event.getType());
        }

        return ResponseEntity.ok(ApiResponse.ok("Received"));
    }
}
