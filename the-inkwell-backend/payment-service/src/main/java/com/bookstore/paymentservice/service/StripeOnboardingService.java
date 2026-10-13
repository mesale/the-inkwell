package com.bookstore.paymentservice.service;

import com.bookstore.paymentservice.client.StoreClient;
import com.bookstore.paymentservice.event.PaymentEventPublisher;
import com.bookstore.paymentservice.event.StripeAccountUpdatedEvent;
import com.bookstore.paymentservice.exception.ConflictException;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.model.LoginLink;
import com.stripe.param.AccountLinkCreateParams;
import com.stripe.param.LoginLinkCreateOnAccountParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import com.bookstore.paymentservice.event.StripeOnboardingEmailEvent;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripeOnboardingService {

    private final StoreClient storeClient;
    private final PaymentEventPublisher paymentEventPublisher;
    private final KafkaTemplate<String, StripeAccountUpdatedEvent> kafkaTemplate;

    public String getStripeAccountId(UUID storeId){

        String stripeAccountId;
        try{
            stripeAccountId = storeClient
                    .getStripeAccountId(storeId)
                    .getBody().data();
        }catch (Exception e){
            log.error("Failed to fetch stripeAccountId");
            throw new ConflictException("Could not retrieve stripeAccountId" + e.getMessage());
        }

        return stripeAccountId;

    }

    public String createAccountLink(String stripeAccountId) throws StripeException {

        AccountLinkCreateParams linkParams = AccountLinkCreateParams.builder()
                .setAccount(stripeAccountId)
                .setRefreshUrl("http://localhost:5173/onbording/retry") // Where to go if the link expires
                .setReturnUrl("http://localhost:5173/store/dashboard") // Where to go after they finish
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .build();

        AccountLink accountLink = AccountLink.create(linkParams);

        return accountLink.getUrl();

    }

    public void sendOnboardingEmail( String onboardingUrl, UUID storeId){

        String businessEmail;

        try{
            businessEmail = storeClient
                    .getStoreEmail(storeId)
                    .getBody().data();
        }catch (Exception e){
            log.error("Failed to fetch stripeAccountId");
            throw new ConflictException("Could not retrieve stripeAccountId" + e.getMessage());
        }

        StripeOnboardingEmailEvent emailEvent = StripeOnboardingEmailEvent.builder()
                .toEmail(businessEmail)
                .storeName(businessEmail)
                .onboardingUrl(onboardingUrl)
                .build();
        paymentEventPublisher.publishStripeOnboardingEmail(emailEvent);
    }

    public void handleAccountUpdated(Account account) {
        publishAccountStatus(account);
    }

    /**
     * Synchronously re-check onboarding status directly from Stripe. Unlike the
     * {@code account.updated} webhook (which cannot reach localhost without forwarding),
     * this can be called on demand. It persists the result via the same event store-service
     * already consumes, and returns the freshly-computed flag.
     */
    public boolean refreshOnboardingStatus(UUID storeId) throws StripeException {
        String stripeAccountId = getStripeAccountId(storeId);
        Account account = Account.retrieve(stripeAccountId);
        return publishAccountStatus(account);
    }

    private boolean publishAccountStatus(Account account) {
        boolean complete = isOnboardingComplete(account);

        StripeAccountUpdatedEvent event = StripeAccountUpdatedEvent.builder()
                .stripeAccountId(account.getId())
                .onboardingComplete(complete)
                .build();

        paymentEventPublisher.publishStripeAccountUpdated(event);
        return complete;
    }

    private boolean isOnboardingComplete(Account account) {
        // These Express accounts request only the `transfers` capability, so charges_enabled
        // stays false; payouts_enabled is the real signal that a payout account is onboarded.
        return Boolean.TRUE.equals(account.getDetailsSubmitted())
                && (Boolean.TRUE.equals(account.getPayoutsEnabled())
                    || Boolean.TRUE.equals(account.getChargesEnabled()));
    }

    public String createLoginLink(String stripeAccountId) throws StripeException {
        LoginLinkCreateOnAccountParams params = LoginLinkCreateOnAccountParams.builder().build();
        LoginLink loginLink = LoginLink.createOnAccount(stripeAccountId, params, null);
        return loginLink.getUrl();
    }

}
