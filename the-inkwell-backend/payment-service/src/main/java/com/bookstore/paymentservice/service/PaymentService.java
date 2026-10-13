package com.bookstore.paymentservice.service;

import com.bookstore.paymentservice.dto.PaymentDto.*;
import com.bookstore.paymentservice.entity.Payout;
import com.bookstore.paymentservice.entity.Subscription;
import com.bookstore.paymentservice.entity.Transaction;
import com.bookstore.paymentservice.event.*;
import com.bookstore.paymentservice.exception.PaymentException;
import com.bookstore.paymentservice.exception.ResourceNotFoundException;
import com.bookstore.paymentservice.repository.PayoutRepository;
import com.bookstore.paymentservice.repository.SubscriptionRepository;
import com.bookstore.paymentservice.repository.TransactionRepository;
import com.stripe.exception.StripeException;
import com.bookstore.paymentservice.event.OrderRefundedEvent;
import com.stripe.model.Account;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.Transfer;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.TransferCreateParams;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class        PaymentService {

    private final TransactionRepository transactionRepository;
    private final PayoutRepository payoutRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentEventPublisher paymentEventPublisher;
    private final StripeOnboardingService stripeOnboardingService;

    private static final BigDecimal FREE_COMMISSION = new BigDecimal("0.05");
    private static final BigDecimal PREMIUM_COMMISSION = new BigDecimal("0.02");

    public void handleStoreCreated  (StoreCreatedEvent event){

        try{
            AccountCreateParams params  = AccountCreateParams.builder()
                    .setType(AccountCreateParams.Type.EXPRESS)
                    .setCountry("US")
                    .setEmail(event.getBusinessEmail())
                    .setCapabilities(
                            AccountCreateParams.Capabilities.builder()
                                    .setTransfers(
                                            AccountCreateParams.Capabilities.Transfers.builder()
                                                    .setRequested(true)
                                                    .build()).
                                    build())
                    .putMetadata("store_id", event.getStoreId().toString())
                    .putMetadata("store_name", event.getStoreName())
                    .build();

            Account account = Account.create(params);

//            AccountLinkCreateParams linkParams = AccountLinkCreateParams.builder()
//                    .setAccount(account.getId())
//                    .setRefreshUrl("https://localhost:5173/onbording/retry") // Where to go if the link expires
//                    .setReturnUrl("https://localhost:5173/") // Where to go after they finish
//                    .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
//                    .build();
//
//            AccountLink accountLink = AccountLink.create(linkParams);

            String onboardingUrl = stripeOnboardingService.createAccountLink(account.getId());

            log.info("Stripe connect account created for storeId: {}", event.getStoreId());
            log.info("Send this to the user to finish setup: {}", onboardingUrl);
            
            StripeOnboardingEmailEvent emailEvent = StripeOnboardingEmailEvent.builder()
                    .toEmail(event.getBusinessEmail())
                    .storeName(event.getStoreName())
                    .onboardingUrl(onboardingUrl)
                    .build();
            paymentEventPublisher.publishStripeOnboardingEmail(emailEvent);

            paymentEventPublisher.publishStripeAccountCreated(
                    new StripeAccountCreatedEvent(
                            event.getStoreId(),
                            account.getId()
                    )
            );

        }catch(StripeException e){
            log.error("Failed to create stripe account for storeId: {}", event.getStoreId());
        }

    }

    @Transactional
    public void handleOrderCreated(OrderCreatedEvent event){

        transactionRepository.findByOrderId(event.getOrderId())
                .ifPresent( t -> {
                    log.warn("Transaction already exists for orderId: {}", event.getStoreId());
                    return;
                });

        // Use PREMIUM commission rate if store has an active subscription
        boolean isPremium = subscriptionRepository.findByStoreId(event.getStoreId())
                .map(sub -> sub.getStatus() == Subscription.SubscriptionStatus.ACTIVE)
                .orElse(false);

        BigDecimal rate = isPremium ? PREMIUM_COMMISSION : FREE_COMMISSION;
        BigDecimal commissionAmount = event.getTotalPrice().multiply(rate);
        BigDecimal netAmount = event.getTotalPrice().subtract(commissionAmount);

        log.info("Applying {} commission ({}) for storeId: {}",
                isPremium ? "PREMIUM" : "FREE", rate, event.getStoreId());

        Transaction transaction = Transaction.builder()
                .orderId(event.getOrderId())
                .buyerKeycloakId(event.getBuyerKeycloakId())
                .branchId(event.getBranchId())
                .storeId(event.getStoreId())
                .amount(event.getTotalPrice())
                .commissionRate(rate)
                .commissionAmount(commissionAmount)
                .netAmount(netAmount)
                .status(Transaction.TransactionStatus.PENDING)
                .build();

        transactionRepository.save(transaction);
        log.info("Transaction created for orderId: {}", event.getOrderId());

    }

    @Transactional
    public void handleDeliveryConfirmed(DeliveryConfirmedEvent event){

        Transaction transaction = transactionRepository.findByOrderId(event.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for orderId: " + event.getOrderId()));

        // Use the netAmount already stored in the Transaction (set correctly at order-creation
        // time using the store's actual subscription plan) as the authoritative payout amount.
        // This prevents commission miscalculation if the order-service ever sends a stale rate.
        BigDecimal payoutAmount = transaction.getNetAmount();

        log.info("Releasing {} (plan rate: {}) to storeId: {} for orderId: {}",
                payoutAmount, transaction.getCommissionRate(), event.getStoreId(), event.getOrderId());

        try {
            long amountInCents = payoutAmount
                    .multiply(new BigDecimal("100"))
                    .longValue();

            TransferCreateParams transferParams = TransferCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency("USD")
                    .setDestination(event.getStripeAccountId())
                    .putMetadata("order_id", event.getOrderId().toString())
                    .putMetadata("store_id", event.getStoreId().toString())
                    .putMetadata("commission_rate", transaction.getCommissionRate().toPlainString())
                    .build();

            Transfer transfer = Transfer.create(transferParams);

            log.info("Stripe transfer created: {} for orderId: {}", transfer.getId(), event.getOrderId());

            transaction.setStatus(Transaction.TransactionStatus.RELEASED);
            transaction.setStripeAccountId(event.getStripeAccountId());
            transactionRepository.save(transaction);

            Payout payout = Payout.builder()
                    .transaction(transaction)
                    .storeId(event.getStoreId())
                    .amount(payoutAmount)
                    .stripeTransferId(transfer.getId())
                    .stripeAccountId(event.getStripeAccountId())
                    .status(Payout.PayoutStatus.COMPLETED)
                    .build();

            payoutRepository.save(payout);
            log.info("Payout recorded for orderId: {}", event.getOrderId());

        } catch (Exception ex) {
            log.error("Failed to release funds for orderId: {}", event.getOrderId(), ex);

            Payout failedPayout = Payout.builder()
                    .transaction(transaction)
                    .storeId(event.getStoreId())
                    .amount(payoutAmount)
                    .stripeAccountId(event.getStripeAccountId())
                    .status(Payout.PayoutStatus.FAILED)
                    .build();

            payoutRepository.save(failedPayout);
        }

    }

    @Transactional
    public CheckoutResponse createCheckoutSession(UUID orderId, String buyerKeycloakId){

        Transaction transaction = null;
        int maxRetries = 6;
        int retryCount = 0;
        while (retryCount < maxRetries) {
            var opt = transactionRepository.findByOrderIdAndBuyerKeycloakId(orderId, buyerKeycloakId);
            if (opt.isPresent()) {
                transaction = opt.get();
                break;
            }
            retryCount++;
            if (retryCount < maxRetries) {
                try {
                    log.info("Transaction not found yet for orderId: {}. Retrying in 400ms... (Attempt {}/{})", orderId, retryCount, maxRetries);
                    Thread.sleep(400);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new PaymentException("Interrupted while waiting for transaction to propagate");
                }
            }
        }

        if (transaction == null) {
            throw new ResourceNotFoundException("Transaction not found for orderId: " + orderId);
        }

        // If a PaymentIntent was already created (HELD status) but not completed, re-use it
        if (transaction.getStatus() == Transaction.TransactionStatus.HELD
                && transaction.getStripePaymentIntentId() != null) {
            try {
                PaymentIntent existingIntent = PaymentIntent.retrieve(transaction.getStripePaymentIntentId());
                log.info("Re-using existing PaymentIntent {} for orderId: {}", existingIntent.getId(), orderId);
                return new CheckoutResponse(
                        orderId,
                        transaction.getId(),
                        existingIntent.getClientSecret(),
                        transaction.getAmount()
                );
            } catch (StripeException ex) {
                log.error("Failed to retrieve existing PaymentIntent for orderId: {}", orderId, ex);
                throw new PaymentException("Failed to resume payment session: " + ex.getMessage());
            }
        }

        if (transaction.getStatus() != Transaction.TransactionStatus.PENDING)
            throw new PaymentException("Payment already completed or refunded for this order");

        try{
            long amountInCents = transaction.getAmount()
                    .multiply(new BigDecimal("100"))
                    .longValue();

            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency("USD")
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .setAllowRedirects(
                                            PaymentIntentCreateParams.AutomaticPaymentMethods.AllowRedirects.NEVER)
                                    .build()
                    )
                    .putMetadata("order_id", orderId.toString())
                    .putMetadata("transaction_id", transaction.getId().toString())
                    .build();


            PaymentIntent paymentIntent = PaymentIntent.create(params);

            transaction.setStripePaymentIntentId(paymentIntent.getId());
            transaction.setStatus(Transaction.TransactionStatus.HELD);
            transactionRepository.save(transaction);

            return new CheckoutResponse(
                    orderId,
                    transaction.getId(),
                    paymentIntent.getClientSecret(),
                    transaction.getAmount()
            );
        }catch (Exception ex){
            log.error("Stripe error when creating PaymentIntent for orderId: {}", orderId, ex);
            throw new PaymentException("Failed to initiate payment for orderID: " + ex.getMessage());
        }

    }

    @Transactional
    public void handleStripeWebhook(String stripePaymentIntentId){

        Transaction transaction = transactionRepository.findByStripePaymentIntentId(stripePaymentIntentId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for payment intent " + stripePaymentIntentId));

        transaction.setStatus(Transaction.TransactionStatus.HELD);
        transactionRepository.save(transaction);

        paymentEventPublisher.publishPaymentCompletes(new PaymentCompletedEvent(
                transaction.getOrderId(),
                stripePaymentIntentId,
                transaction.getAmount()
        ));

        log.info("Payment confirmed for orderId: {}", transaction.getOrderId());

    }

    public List<TransactionResponse> getStoreTransactions(UUID storeId){
        return transactionRepository.findByStoreId(storeId)
                .stream()
                .map(this::toTransactionResponse)
                .toList();
    }

    public List<PayoutResponse> getStorePayouts(UUID storeId){

        return payoutRepository.findByStoreId(storeId)
                .stream()
                .map(this::toPayoutResponse)
                .toList();

    }

    @Transactional
    public RefundResponse requestRefund(UUID orderId, String buyerKeycloakId) {

        Transaction transaction = transactionRepository.findByOrderIdAndBuyerKeycloakId(orderId, buyerKeycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found for orderId: " + orderId));

        // Only HELD (paid, not yet released/delivered) transactions can be refunded
        if (transaction.getStatus() != Transaction.TransactionStatus.HELD) {
            throw new PaymentException(
                "Refund not allowed. Order must be paid but not yet delivered. Current status: "
                    + transaction.getStatus()
            );
        }

        if (transaction.getStripePaymentIntentId() == null) {
            throw new PaymentException("No Stripe payment found for this order.");
        }

        try {
            RefundCreateParams refundParams = RefundCreateParams.builder()
                    .setPaymentIntent(transaction.getStripePaymentIntentId())
                    .putMetadata("order_id", orderId.toString())
                    .putMetadata("reason", "buyer_requested")
                    .build();

            Refund refund = Refund.create(refundParams);
            log.info("Stripe refund {} created for orderId: {}", refund.getId(), orderId);

            transaction.setStatus(Transaction.TransactionStatus.REFUNDED);
            transactionRepository.save(transaction);

            paymentEventPublisher.publishOrderRefunded(OrderRefundedEvent.builder()
                    .orderId(orderId)
                    .buyerKeycloakId(buyerKeycloakId)
                    .refundedAmount(transaction.getAmount())
                    .stripeRefundId(refund.getId())
                    .build());

            return new RefundResponse(orderId, refund.getId(), transaction.getAmount());

        } catch (StripeException ex) {
            log.error("Stripe refund failed for orderId: {}", orderId, ex);
            throw new PaymentException("Refund failed: " + ex.getMessage());
        }

    }

    public List<TransactionResponse> getAllTransactions(){

        return transactionRepository.findAll()
                .stream()
                .map(this::toTransactionResponse)
                .toList();

    }

    private TransactionResponse toTransactionResponse(Transaction t) {
        return new TransactionResponse(
                t.getId(),
                t.getOrderId(),
                t.getStoreId(),
                t.getBranchId(),
                t.getAmount(),
                t.getCommissionRate(),
                t.getCommissionAmount(),
                t.getNetAmount(),
                t.getStripePaymentIntentId(),
                t.getStatus().name(),
                t.getCreatedAt()
        );
    }

    private PayoutResponse toPayoutResponse(Payout p) {
        return new PayoutResponse(
                p.getId(),
                p.getTransaction().getId(),
                p.getStoreId(),
                p.getAmount(),
                p.getStripeTransferId(),
                p.getStatus().name(),
                p.getCreatedAt()
        );
    }
}


