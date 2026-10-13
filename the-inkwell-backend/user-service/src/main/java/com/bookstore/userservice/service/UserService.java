package com.bookstore.userservice.service;

import com.bookstore.userservice.client.StoreClient;
import com.bookstore.userservice.dto.UserDto.*;
import com.bookstore.userservice.entity.Employee;
import com.bookstore.userservice.entity.StoreOwner;
import com.bookstore.userservice.entity.User;
import com.bookstore.userservice.event.CreateStoreOwnerEvent;
import com.bookstore.userservice.exception.ConflictException;
import com.bookstore.userservice.exception.KeycloakException;
import com.bookstore.userservice.exception.ResourceNotFoundException;
import com.bookstore.userservice.repository.EmployeeRepository;
import com.bookstore.userservice.repository.StoreOwnerRepository;
import com.bookstore.userservice.repository.UserRepository;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final StoreOwnerRepository storeOwnerRepository;
    private final EmployeeRepository employeeRepository;
    private final com.bookstore.userservice.repository.EmployeeInvitationRepository employeeInvitationRepository;
    private final StoreClient storeClient;
    private final Keycloak keycloak;
    private final com.bookstore.userservice.event.UserEventPublisher userEventPublisher;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public UserResponse registerUser(RegisterUserRequest request) {

        if (userRepository.existsByEmail(request.email()))
            throw new ConflictException("Email already in use");

        UserRepresentation keycloakUser = new UserRepresentation();
        keycloakUser.setEmail(request.email());
        keycloakUser.setUsername(request.email());
        keycloakUser.setEnabled(true);
        keycloakUser.setEmailVerified(true);
        keycloakUser.setFirstName(request.name());

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.password());
        credential.setTemporary(false);
        keycloakUser.setCredentials(Collections.singletonList(credential));

        Response response =keycloak.realm(realm).users().create(keycloakUser);

        if (response.getStatus()!=201){
            throw new KeycloakException("Failed to create keycloakU  ser: " + response.getStatus());
        }

        String keycloakId = response.getLocation().getPath().replaceAll(".*/([^/]+)$", "$1");
        response.close();

        RoleRepresentation userRole;
        try {
            userRole = keycloak.realm(realm).roles().get("ROLE_USER").toRepresentation();

            keycloak.realm(realm).users().get(keycloakId)
                    .roles().realmLevel().add(Collections.singletonList(userRole));

            User user = User.builder()
                    .keycloakId(keycloakId)
                    .name(request.name())
                    .email(request.email())
                    .phone(request.phone())
                    .build();


            return touserResponse(userRepository.save(user));
        } catch (Exception e) {
            throw new RuntimeException("Postgres save failed. Keycloak user rolled back. Error: " + e.getMessage());
        }

    }

    public UserResponse getByKeycloakId(String keycloakId){
        User user = userRepository.findByKeycloakId(keycloakId).orElseThrow(() -> new ResourceNotFoundException("User Not Found"));
        return touserResponse(user);
    }

    public UserResponse updateUser(String keycloakId,UpdateProfileRequest request){
        User user = userRepository.findByKeycloakId(keycloakId).orElseThrow(() ->new ResourceNotFoundException("User Not Found"));

        user.setName(request.name());
        user.setPhone(request.phone());

        return touserResponse(userRepository.save(user));
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User Not Found"));

        try {
            keycloak.realm(realm).users().get(user.getKeycloakId()).executeActionsEmail(List.of("UPDATE_PASSWORD"));
            log.info("Password reset email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send reset password email", e);
            throw new KeycloakException("Failed to send reset password email");
        }
    }

    @Transactional
    public void createStoreOwnerFromStoreCreated(CreateStoreOwnerEvent event){

        if (storeOwnerRepository.existsByStoreId(event.getStoreId())){
            log.warn("Store already has an owner");
            return;
        }

        User user = userRepository.findByKeycloakId(event.getUserKeycloakId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (storeOwnerRepository.existsByUserId(user.getId())){
            log.warn("Store owner already exist");
            return;
        }

        try {

            RoleRepresentation storeAdmin = keycloak.realm(realm)
                    .roles()
                    .get("ROLE_STORE_ADMIN")
                    .toRepresentation();

            keycloak.realm(realm).users()
                    .get(event.getUserKeycloakId())
                    .roles().realmLevel()
                    .add(Collections.singletonList(storeAdmin));


        } catch(Exception ex){
            log.warn("Could not assign ROLE_STORE_ADMIN to keycloakId: {}. " +
                    "Role may already be assigned.", event.getUserKeycloakId());
        }

        StoreOwner storeOwner = StoreOwner.builder()
                .storeId(event.getStoreId())
                .userId(user.getId())
                .build();

        UserRepresentation updatedOwner = keycloak.realm(realm).users().get(event.getUserKeycloakId()).toRepresentation();
        Map<String, List<String>> attributes = updatedOwner.getAttributes();
        if (attributes == null) attributes = new HashMap<>();

        attributes.put("store_id", List.of(event.getStoreId().toString()));
        updatedOwner.setAttributes(attributes);

        keycloak.realm(realm).users().get(event.getUserKeycloakId()).update(updatedOwner);

        storeOwnerRepository.save(storeOwner);

        log.info("StoreOwner created for storeId: {}", event.getStoreId());

    }

    @Transactional
    public UserResponse addEmployee(UUID storeId, UUID branchId, EmployeeRequest request){

        boolean branchExists = false;

        try {
            branchExists = storeClient
                    .branchExists(storeId, branchId)
                    .getBody().data();
        }catch (Exception ex){
            log.info("Failed to check if branch exists");
            throw new ConflictException("Couldn't check if branch exists" + ex.getMessage());
        }

        if (!branchExists)
            throw new RuntimeException("branch don't exist");

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (employeeRepository.existsByUserId(user.getId())) {
             throw new ConflictException("User is already an employee");
        }
        
        Optional<com.bookstore.userservice.entity.EmployeeInvitation> existingInvite = 
                employeeInvitationRepository.findByUserIdAndStoreIdAndStatus(user.getId(), storeId, "PENDING");
        if (existingInvite.isPresent()) {
             throw new ConflictException("User already has a pending invitation to this store");
        }

        String token = UUID.randomUUID().toString();
        com.bookstore.userservice.entity.EmployeeInvitation invitation = com.bookstore.userservice.entity.EmployeeInvitation.builder()
                .storeId(storeId)
                .branchId(branchId)
                .userId(user.getId())
                .role(request.role().name())
                .token(token)
                .status("PENDING")
                .expiresAt(java.time.LocalDateTime.now().plusDays(7))
                .build();

        employeeInvitationRepository.save(invitation);

        com.bookstore.userservice.event.EmployeeInvitationEmailEvent emailEvent = com.bookstore.userservice.event.EmployeeInvitationEmailEvent.builder()
                .invitationId(invitation.getId())
                .toEmail(user.getEmail())
                .userName(user.getName())
                .token(token)
                .frontendUrl(frontendUrl)
                .build();

        userEventPublisher.publishEmployeeInvitationEmail(emailEvent);

        return touserResponse(user);
    }

    @Transactional
    public UserResponse confirmEmployeeInvitation(String token) {
        com.bookstore.userservice.entity.EmployeeInvitation invitation = employeeInvitationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found or invalid"));

        if (!invitation.getStatus().equals("PENDING")) {
            throw new ConflictException("Invitation is no longer pending");
        }

        if (invitation.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            invitation.setStatus("EXPIRED");
            employeeInvitationRepository.save(invitation);
            throw new ConflictException("Invitation has expired");
        }

        User user = userRepository.findById(invitation.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Employee employee = Employee.builder()
                .userId(user.getId())
                .branchId(invitation.getBranchId())
                .role(Employee.Role.valueOf(invitation.getRole()))
                .build();

        UserRepresentation updatedEmployee = keycloak.realm(realm).users().get(user.getKeycloakId()).toRepresentation();
        Map<String, List<String>> attributes = updatedEmployee.getAttributes();
        if (attributes == null) attributes = new HashMap<>();

        attributes.put("store_id", List.of(invitation.getStoreId().toString()));
        attributes.put("branch_id", List.of((invitation.getBranchId().toString())));
        updatedEmployee.setAttributes(attributes);

        keycloak.realm(realm).users().get(user.getKeycloakId()).update(updatedEmployee);

        try {
            RoleRepresentation storeAdmin = keycloak.realm(realm)
                    .roles()
                    .get("ROLE_" + invitation.getRole())
                    .toRepresentation();

            keycloak.realm(realm).users()
                    .get(user.getKeycloakId())
                    .roles().realmLevel()
                    .add(Collections.singletonList(storeAdmin));

        } catch(Exception ex){
            log.warn("Could not assign ROLE_" + invitation.getRole() +" to keycloakId: {}. " +
                    "Role may already be assigned.", user.getKeycloakId());
        }
        
        employeeRepository.save(employee);
        
        invitation.setStatus("ACCEPTED");
        employeeInvitationRepository.save(invitation);

        return touserResponse(user);
    }
    
    public com.bookstore.userservice.dto.EmployeeInvitationResponse getInvitationDetails(String token) {
        com.bookstore.userservice.entity.EmployeeInvitation invitation = employeeInvitationRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found"));
        return new com.bookstore.userservice.dto.EmployeeInvitationResponse(
                invitation.getStoreId(),
                invitation.getBranchId(),
                invitation.getRole(),
                invitation.getStatus()
        );
    }

    public List<UserResponse> getEmployees(UUID branchId){

        List<UUID> userIds = employeeRepository.findByBranchId(branchId)
                .stream()
                .map(Employee::getUserId)
                .toList();

        return userRepository.findAllById(userIds)
                .stream()
                .map(this::touserResponse)
                .toList();
    }

    private UserResponse touserResponse(User user){
        return new UserResponse(
                user.getId(),
                user.getKeycloakId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getCreatedAt()
        );
    }
}
