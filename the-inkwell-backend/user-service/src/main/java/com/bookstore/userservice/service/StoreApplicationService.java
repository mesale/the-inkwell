package com.bookstore.userservice.service;

import com.bookstore.userservice.dto.StoreApplicationDto.*;
import com.bookstore.userservice.entity.StoreApplication;
import com.bookstore.userservice.entity.StoreApplicationToken;
import com.bookstore.userservice.entity.User;
import com.bookstore.userservice.event.StoreApplicationApprovedEvent;
import com.bookstore.userservice.event.UserEventPublisher;
import com.bookstore.userservice.exception.ConflictException;
import com.bookstore.userservice.exception.ResourceNotFoundException;
import com.bookstore.userservice.repository.StoreApplicationRepository;
import com.bookstore.userservice.repository.StoreApplicationTokenRepository;
import com.bookstore.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import com.bookstore.userservice.event.StoreApplicationEmailEvent;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoreApplicationService {

    private final StoreApplicationRepository applicationRepository;
    private final StoreApplicationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final UserEventPublisher userEventPublisher;
    private final Keycloak keycloak;

    @Value("${keycloak.realm}")
    private String realm;

    public void initiateApplication(String keycloakId, String businessEmail){
        log.info("Starting store application for userId: {}, email: {}", keycloakId, businessEmail);
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> {
                    log.error("User not found for keycloakId: {}", keycloakId);
                   return new ResourceNotFoundException("user not found");
                });

        UUID token = UUID.randomUUID();

        StoreApplicationToken appToken = StoreApplicationToken.builder()
                .user(user)
                .email(businessEmail)
                .token(token)
                .expiresAt(LocalDateTime.now().plusHours(48))
                .used(false)
                .build();
        log.info("User found: {}", user.getId());

        tokenRepository.save(appToken);
        log.info("Token saved: {}", token);

        StoreApplicationEmailEvent event = StoreApplicationEmailEvent.builder()
                .toEmail(businessEmail)
                .applicantName(user.getName())
                .token(token.toString())
                .build();
        
        userEventPublisher.publishStoreApplicationEmail(event);
        log.info("Email sent successfully");

    }

    public TokenValidationResponse validateToken(String token){
        UUID tokenUUID;
        try {
            tokenUUID = UUID.fromString(token);
        } catch (IllegalArgumentException e) {
            return new TokenValidationResponse(false, "Invalid token format", null);
        }

        return tokenRepository.findByTokenAndUsedFalse(tokenUUID)
                .map(t -> {
                    if (t.getExpiresAt().isBefore(LocalDateTime.now())) {
                        return new TokenValidationResponse(false, "Token has expired", null);
                    }
                    return new TokenValidationResponse(true, "Token is valid", t.getEmail());
                })
                .orElse(new TokenValidationResponse(false, "Token not found or already used", null));
    }


    public StoreApplicationResponse submitApplication(String keycloakId, SubmitApplicationRequest request){
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));

        if(applicationRepository.existsByUserIdAndStatus(user.getId(), StoreApplication.Status.PENDING))
            throw new ConflictException("You already have a pending request");

        StoreApplicationToken appToken = tokenRepository
                .findByTokenAndUsedFalse(request.token())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired token"));

        if (appToken.getExpiresAt().isBefore(LocalDateTime.now()))
            throw new ConflictException("Token has expired");

        appToken.setUsed(true);
        tokenRepository.save(appToken);

        StoreApplication storeApplication =StoreApplication.builder()
                .user(user)
                .businessEmail(request.businessEmail())
                .storeName(request.storeName())
                .phone(request.phone())
                .address(request.address())
                .city(request.city())
                .description(request.description())
                .status(StoreApplication.Status.PENDING)
                .build();


        return toApplicationResponse(applicationRepository.save(storeApplication));
    }

    public StoreApplicationResponse getMyApplication(String keycloakId){

        User user = userRepository.findByKeycloakId(keycloakId).orElseThrow(() -> new ResourceNotFoundException("User not found"));


        StoreApplication storeApplication = applicationRepository.
                findByUserIdAndStatus(user.getId(), StoreApplication.Status.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("No applications found"));

        return toApplicationResponse(storeApplication);
    }

    public List<StoreApplicationResponse> getAllPending(){
        return applicationRepository.findByStatus(StoreApplication.Status.PENDING)
                .stream()
                .map(this::toApplicationResponse)
                .toList();
    }

    public StoreApplicationResponse approveApplication(UUID applicationId){
        StoreApplication application = applicationRepository
                .findById(applicationId).orElseThrow(() -> new ResourceNotFoundException("Application not Found"));
        String id = application.getUser().getKeycloakId();

        UserRepresentation keUser = keycloak.realm(realm).users().get(id).toRepresentation();

        if (keUser.getEmail() == null)
            throw new RuntimeException("Email is lost");

        if (application.getStatus() != StoreApplication.Status.PENDING)
            throw new ConflictException("Application is not in pending state");

        RoleRepresentation storeAdminRole = keycloak.realm(realm)
                .roles()
                .get("ROLE_STORE_ADMIN")
                .toRepresentation();
        keycloak.realm(realm)
                .users()
                .get(id)
                .roles()
                .realmLevel()
                .add(Collections.singletonList(storeAdminRole));

        application.setStatus(StoreApplication.Status.APPROVED);
        application.setReviewedAt(LocalDateTime.now());
        applicationRepository.save(application);

        StoreApplicationApprovedEvent event = StoreApplicationApprovedEvent.builder()
                .applicationId(applicationId)
                .userId(application.getUser().getId())
                .ownerKeycloakId(application.getUser().getKeycloakId())
                .ownerName(application.getUser().getName())
                .ownerEmail(application.getUser().getEmail())
                .ownerPhone(application.getUser().getPhone())
                .businessEmail(application.getBusinessEmail())
                .storeName(application.getStoreName())
                .phone(application.getPhone())
                .address(application.getAddress())
                .city(application.getCity())
                .build();

        userEventPublisher.publishStoreApplicationApproved(event);

        return toApplicationResponse(application);
    }

    public StoreApplicationResponse rejectApplication(UUID applicationId, String rejectionReason){

        StoreApplication application = applicationRepository
                .findById(applicationId).orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (application.getStatus() != StoreApplication.Status.PENDING)
            throw new ConflictException("Application not in pending state");

        application.setStatus(StoreApplication.Status.REJECTED);
        application.setRejectionReason(rejectionReason);
        application.setReviewedAt(LocalDateTime.now());

        applicationRepository.save(application);

        return toApplicationResponse(application);

    }

    public StoreApplicationResponse toApplicationResponse(StoreApplication storeApplication){
        return new StoreApplicationResponse(
                storeApplication.getId(),
                storeApplication.getUser().getId(),
                storeApplication.getBusinessEmail(),
                storeApplication.getStoreName(),
                storeApplication.getPhone(),
                storeApplication.getAddress(),
                storeApplication.getCity(),
                storeApplication.getDescription(),
                storeApplication.getUser() != null ? storeApplication.getUser().getName() : null,
                storeApplication.getUser() != null ? storeApplication.getUser().getEmail() : null,
                storeApplication.getStatus(),
                storeApplication.getRejectionReason(),
                storeApplication.getSubmittedAt(),
                storeApplication.getReviewedAt()
        );
    }

}
