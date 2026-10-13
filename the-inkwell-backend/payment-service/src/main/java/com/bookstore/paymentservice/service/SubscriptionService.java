package com.bookstore.paymentservice.service;

import com.bookstore.paymentservice.client.StoreClient;
import com.bookstore.paymentservice.dto.PaymentDto.*;
import com.bookstore.paymentservice.entity.Subscription;
import com.bookstore.paymentservice.event.PaymentEventPublisher;
import com.bookstore.paymentservice.event.SubscriptionActivatedEvent;
import com.bookstore.paymentservice.event.SubscriptionCancelledEvent;
import com.bookstore.paymentservice.exception.PaymentException;
import com.bookstore.paymentservice.exception.ResourceNotFoundException;
import com.bookstore.paymentservice.repository.SubscriptionRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.SetupIntent;
import com.stripe.model.Invoice;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.SetupIntentCreateParams;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentEventPublisher paymentEventPublisher;
    private final StoreClient storeClient;

    @Value("${stripe.premium-price-id}")
    private String premiumPriceId;

    /** Cached, lazily-resolved Stripe price id (see {@link #resolvePriceId()}). */
    private volatile String resolvedPriceId;

    /**
     * Step 1: Create/retrieve a Stripe Customer + SetupIntent client_secret.
     * The frontend mounts the Card element to collect payment method details.
     */
    @Transactional
    public SubscribeSetupResponse createSubscriptionSetup(UUID storeId) {

        // Reuse existing subscription record if present
        Subscription sub = subscriptionRepository.findByStoreId(storeId)
                .orElse(null);

        String customerId;
        try {
            String priceId = resolvePriceId();
            if (sub != null && sub.getStripeCustomerId() != null) {
                customerId = sub.getStripeCustomerId();
            } else {
                // Fetch store email from store-service
                String email = storeClient.getStoreEmail(storeId).getBody().data();
                CustomerCreateParams customerParams = CustomerCreateParams.builder()
                        .setEmail(email)
                        .putMetadata("store_id", storeId.toString())
                        .build();
                Customer customer = Customer.create(customerParams);
                customerId = customer.getId();
            }

            SetupIntentCreateParams setupParams = SetupIntentCreateParams.builder()
                    .setCustomer(customerId)
                    .addPaymentMethodType("card")
                    .putMetadata("store_id", storeId.toString())
                    .putMetadata("price_id", priceId)
                    .build();

            SetupIntent setupIntent = SetupIntent.create(setupParams);

            // Persist or update subscription record
            if (sub == null) {
                sub = Subscription.builder()
                        .storeId(storeId)
                        .stripeCustomerId(customerId)
                        .stripePriceId(priceId)
                        .status(Subscription.SubscriptionStatus.INCOMPLETE)
                        .build();
            } else {
                sub.setStripeCustomerId(customerId);
                sub.setStripePriceId(priceId);
            }
            subscriptionRepository.save(sub);

            return new SubscribeSetupResponse(
                    storeId,
                    customerId,
                    setupIntent.getClientSecret(),
                    priceId
            );
        } catch (StripeException ex) {
            log.error("Failed to create subscription setup for storeId: {}", storeId, ex);
            throw new PaymentException("Failed to set up subscription: " + ex.getMessage());
        }
    }

    /**
     * Step 2: After frontend collects payment method, attach it to the customer and create subscription.
     */
    @Transactional
    public SubscribeConfirmResponse confirmSubscription(UUID storeId, String paymentMethodId) {

        Subscription sub = subscriptionRepository.findByStoreId(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("No subscription setup found for storeId: " + storeId));

        try {
            // Attach payment method to customer
            com.stripe.model.PaymentMethod pm = com.stripe.model.PaymentMethod.retrieve(paymentMethodId);
            pm.attach(com.stripe.param.PaymentMethodAttachParams.builder()
                    .setCustomer(sub.getStripeCustomerId())
                    .build());

            // Set as default payment method
            com.stripe.model.Customer customer = Customer.retrieve(sub.getStripeCustomerId());
            customer.update(com.stripe.param.CustomerUpdateParams.builder()
                    .setInvoiceSettings(
                            com.stripe.param.CustomerUpdateParams.InvoiceSettings.builder()
                                    .setDefaultPaymentMethod(paymentMethodId)
                                    .build())
                    .build());

            // Create subscription
            com.stripe.model.Subscription stripeSub =
                    com.stripe.model.Subscription.create(
                            com.stripe.param.SubscriptionCreateParams.builder()
                                    .setCustomer(sub.getStripeCustomerId())
                                    .addItem(com.stripe.param.SubscriptionCreateParams.Item.builder()
                                            .setPrice(resolvePriceId())
                                            .build())
                                    .setDefaultPaymentMethod(paymentMethodId)
                                    .putMetadata("store_id", storeId.toString())
                                    .build()
                    );

            sub.setStripeSubscriptionId(stripeSub.getId());
            sub.setStatus(mapStripeStatus(stripeSub.getStatus()));
            if (stripeSub.getCurrentPeriodEnd() != null) {
                sub.setCurrentPeriodEnd(
                        LocalDateTime.ofInstant(
                                Instant.ofEpochSecond(stripeSub.getCurrentPeriodEnd()), ZoneOffset.UTC));
            }
            subscriptionRepository.save(sub);

            // Notify store-service if immediately active
            if ("active".equals(stripeSub.getStatus())) {
                publishActivated(sub);
            }

            return new SubscribeConfirmResponse(
                    storeId,
                    stripeSub.getId(),
                    stripeSub.getStatus(),
                    sub.getCurrentPeriodEnd()
            );
        } catch (StripeException ex) {
            log.error("Failed to confirm subscription for storeId: {}", storeId, ex);
            throw new PaymentException("Failed to confirm subscription: " + ex.getMessage());
        }
    }

    /**
     * Cancel the store's premium subscription (at period end).
     */
    @Transactional
    public SubscriptionStatusResponse cancelSubscription(UUID storeId) {

        Subscription sub = subscriptionRepository.findByStoreId(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("No subscription found for storeId: " + storeId));

        if (sub.getStripeSubscriptionId() == null) {
            throw new PaymentException("No active Stripe subscription to cancel.");
        }

        try {
            com.stripe.model.Subscription stripeSub =
                    com.stripe.model.Subscription.retrieve(sub.getStripeSubscriptionId());

            stripeSub.update(com.stripe.param.SubscriptionUpdateParams.builder()
                    .setCancelAtPeriodEnd(true)
                    .build());

            sub.setCancelAtPeriodEnd(true);
            subscriptionRepository.save(sub);

            log.info("Subscription {} set to cancel at period end for storeId: {}",
                    sub.getStripeSubscriptionId(), storeId);

            return toStatusResponse(sub);
        } catch (StripeException ex) {
            log.error("Failed to cancel subscription for storeId: {}", storeId, ex);
            throw new PaymentException("Failed to cancel subscription: " + ex.getMessage());
        }
    }

    /**
     * Get the current subscription status for a store.
     */
    public SubscriptionStatusResponse getSubscriptionStatus(UUID storeId) {
        return subscriptionRepository.findByStoreId(storeId)
                .map(this::toStatusResponse)
                .orElse(new SubscriptionStatusResponse(storeId, null, "NONE", null, false));
    }

    // ── Webhook Handlers ──────────────────────────────────────────────────────

    @Transactional
    public void handleSubscriptionUpdated(com.stripe.model.Subscription stripeSub) {
        subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId())
                .ifPresent(sub -> {
                    sub.setStatus(mapStripeStatus(stripeSub.getStatus()));
                    sub.setCancelAtPeriodEnd(Boolean.TRUE.equals(stripeSub.getCancelAtPeriodEnd()));
                    if (stripeSub.getCurrentPeriodEnd() != null) {
                        sub.setCurrentPeriodEnd(LocalDateTime.ofInstant(
                                Instant.ofEpochSecond(stripeSub.getCurrentPeriodEnd()), ZoneOffset.UTC));
                    }
                    subscriptionRepository.save(sub);

                    if ("active".equals(stripeSub.getStatus())) {
                        publishActivated(sub);
                    } else if ("canceled".equals(stripeSub.getStatus())) {
                        publishCancelled(sub);
                    }
                    log.info("Subscription {} updated: status={}", stripeSub.getId(), stripeSub.getStatus());
                });
    }

    @Transactional
    public void handleSubscriptionDeleted(com.stripe.model.Subscription stripeSub) {
        subscriptionRepository.findByStripeSubscriptionId(stripeSub.getId())
                .ifPresent(sub -> {
                    sub.setStatus(Subscription.SubscriptionStatus.CANCELED);
                    subscriptionRepository.save(sub);
                    publishCancelled(sub);
                    log.info("Subscription {} deleted for storeId: {}", stripeSub.getId(), sub.getStoreId());
                });
    }

    @Transactional
    public void handleInvoicePaymentSucceeded(Invoice invoice) {
        String subscriptionId = invoice.getSubscription();
        if (subscriptionId == null) return;

        subscriptionRepository.findByStripeSubscriptionId(subscriptionId)
                .ifPresent(sub -> {
                    sub.setStatus(Subscription.SubscriptionStatus.ACTIVE);
                    subscriptionRepository.save(sub);
                    publishActivated(sub);
                    log.info("Invoice paid, subscription {} active for storeId: {}", subscriptionId, sub.getStoreId());
                });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Resolve the configured premium plan identifier to a Stripe <b>price</b> id.
     * Accepts a price id (used as-is) or a product id (resolves its active recurring price),
     * so the subscription API always receives a {@code price_…} id. Cached after first resolution.
     */
    private String resolvePriceId() throws StripeException {
        String cached = resolvedPriceId;
        if (cached != null) return cached;

        if (premiumPriceId == null || premiumPriceId.isBlank()) {
            throw new PaymentException("Premium price is not configured (stripe.premium-price-id).");
        }

        String resolved;
        if (premiumPriceId.startsWith("prod_")) {
            // A product id was configured — look up its active recurring price.
            com.stripe.model.PriceCollection prices = com.stripe.model.Price.list(
                    com.stripe.param.PriceListParams.builder()
                            .setProduct(premiumPriceId)
                            .setActive(true)
                            .setType(com.stripe.param.PriceListParams.Type.RECURRING)
                            .setLimit(1L)
                            .build());
            if (prices.getData().isEmpty()) {
                throw new PaymentException("Stripe product " + premiumPriceId
                        + " has no active recurring price. Set stripe.premium-price-id to a price_… id.");
            }
            resolved = prices.getData().get(0).getId();
        } else {
            // A price_… id (or any other value) — use as-is and let Stripe validate it.
            resolved = premiumPriceId;
        }

        resolvedPriceId = resolved;
        log.info("Resolved premium plan id '{}' to Stripe price '{}'", premiumPriceId, resolved);
        return resolved;
    }

    private void publishActivated(Subscription sub) {
        paymentEventPublisher.publishSubscriptionActivated(
                SubscriptionActivatedEvent.builder()
                        .storeId(sub.getStoreId())
                        .stripeSubscriptionId(sub.getStripeSubscriptionId())
                        .stripePriceId(sub.getStripePriceId())
                        .currentPeriodEnd(sub.getCurrentPeriodEnd() != null
                                ? sub.getCurrentPeriodEnd().toString() : null)
                        .build()
        );
    }

    private void publishCancelled(Subscription sub) {
        paymentEventPublisher.publishSubscriptionCancelled(
                SubscriptionCancelledEvent.builder()
                        .storeId(sub.getStoreId())
                        .stripeSubscriptionId(sub.getStripeSubscriptionId())
                        .build()
        );
    }

    private SubscriptionStatusResponse toStatusResponse(Subscription sub) {
        return new SubscriptionStatusResponse(
                sub.getStoreId(),
                sub.getStripeSubscriptionId(),
                sub.getStatus().name(),
                sub.getCurrentPeriodEnd(),
                sub.isCancelAtPeriodEnd()
        );
    }

    private Subscription.SubscriptionStatus mapStripeStatus(String status) {
        return switch (status) {
            case "active" -> Subscription.SubscriptionStatus.ACTIVE;
            case "past_due" -> Subscription.SubscriptionStatus.PAST_DUE;
            case "canceled" -> Subscription.SubscriptionStatus.CANCELED;
            case "trialing" -> Subscription.SubscriptionStatus.TRIALING;
            default -> Subscription.SubscriptionStatus.INCOMPLETE;
        };
    }
}
