package com.bookstore.storeservice.service;

import com.bookstore.storeservice.dto.StoreDto.*;
import com.bookstore.storeservice.entity.Document;
import com.bookstore.storeservice.entity.Store;
import com.bookstore.storeservice.exception.ConflictException;
import com.bookstore.storeservice.exception.ResourceNotFoundException;
import com.bookstore.storeservice.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminStoreService {

    private final StoreRepository storeRepository;

    @Value("http://localhost:9000")
    private String minioUrl;

    @Value("${minio.bucket-name}")
    private String minioBucket;

    @Transactional(readOnly = true)
    public List<StoreResponse> getStoresByStatus(Store.VerificationStatus status) {
        return storeRepository.findByVerificationStatus(status)
                .stream()
                .map(this::toStoreResponse)
                .toList();
    }


    public StoreResponse changeToAwaiting(UUID storeId){
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store Not Found"));

        store.setVerificationStatus(Store.VerificationStatus.AWAITING_DOCS);

        return toStoreResponse(storeRepository.save(store));

    }

    @Transactional
    public StoreResponse approveStore(UUID storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found"));

        if (store.getVerificationStatus() != Store.VerificationStatus.DOCS_SUBMITTED)
            throw new ConflictException("Store must be in DOCS_SUBMITTED status to approve");

        store.setVerificationStatus(Store.VerificationStatus.APPROVED);
        return toStoreResponse(storeRepository.save(store));
    }

    @Transactional
    public StoreResponse rejectStore(UUID storeId, String reason) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found"));

        if (store.getVerificationStatus() == Store.VerificationStatus.APPROVED)
            throw new ConflictException("Cannot reject an already approved store");

        store.setVerificationStatus(Store.VerificationStatus.REJECTED);
        store.setRejectionReason(reason);
        return toStoreResponse(storeRepository.save(store));
    }

    private StoreResponse toStoreResponse(Store store) {
        List<DocumentResponse> docs = store.getDocuments() == null ? List.of() :
                store.getDocuments().stream()
                        .map(doc -> new DocumentResponse(
                                doc.getId(),
                                doc.getDocumentType() != null ? doc.getDocumentType().name() : "OTHER",
                                doc.getFileName(),
                                minioUrl + "/" + minioBucket + "/" + doc.getObjectKey()
                        ))
                        .toList();

        return new StoreResponse(
                store.getId(),
                store.getStoreName(),
                store.getBusinessRegNumber(),
                store.getTin(),
                store.getRegion(),
                store.getCity(),
                store.getAddress(),
                store.getEmail(),
                store.getPhone(),
                store.getBankName(),
                store.getBankAccount(),
                store.getPlan().name(),
                store.getVerificationStatus().name(),
                store.getRejectionReason(),
                store.getCreatedAt(),
                docs
        );
    }
}