package com.bookstore.storeservice.service;

import com.bookstore.storeservice.dto.BranchDto.*;
import com.bookstore.storeservice.entity.Branch;
import com.bookstore.storeservice.entity.Store;
import com.bookstore.storeservice.exception.ConflictException;
import com.bookstore.storeservice.exception.ResourceNotFoundException;
import com.bookstore.storeservice.repository.BranchRepository;
import com.bookstore.storeservice.repository.StoreRepository;
import jakarta.ws.rs.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BranchService {

    private final BranchRepository branchRepository;
    private final StoreRepository storeRepository;

    public BranchResponse CreateBranch(UUID storeId, CreateBranchRequest request){

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found"));

        if (branchRepository.existsByBranchNameAndStoreId(request.branchName(), storeId))
            throw new ConflictException("Branch with this name already exists in your store");

        Branch branch = Branch.builder()
                .store(store)
                .branchName(request.branchName())
                .region(request.region())
                .city(request.city())
                .address(request.address())
                .phone(request.phone())
                .build();

        return toBranchResponse(branchRepository.save(branch));

    }

    public List<BranchResponse> getMyBranches(UUID storeId){

        return branchRepository.findByStoreId(storeId)
                .stream()
                .map(this::toBranchResponse)
                .toList();

    }

    public BranchResponse getBranch(UUID storeId, UUID branchId){

        Branch branch = branchRepository.findByIdAndStoreId(branchId, storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        return toBranchResponse(branch);

    }

    public BranchResponse getBranchById(UUID branchId){
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        return toBranchResponse(branch);
    }

    public List<BranchResponse> getStoreBranches(UUID storeId){

        return branchRepository.findByStoreId(storeId)
                .stream().map(this::toBranchResponse)
                .toList();

    }

    public boolean branchExists(UUID branchId, UUID storeId){
        return branchRepository.existsByIdAndStoreId(branchId, storeId);
    }

    public BranchResponse updateBranch(UUID storeId, UUID branchId, UpdateBranchRequest request){

        Branch branch = branchRepository.findByIdAndStoreId(storeId, branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        branch.setBranchName(request.branchName());
        branch.setRegion(request.region());
        branch.setCity(request.city());
        branch.setAddress(request.address());
        branch.setPhone(request.phone());

        return toBranchResponse(branchRepository.save(branch));

    }

    public void deleteBranch(UUID storeId, UUID branchId){

        Branch branch = branchRepository.findByIdAndStoreId(branchId, storeId)
                .orElseThrow(() -> new NotFoundException("Branch not found"));

        branchRepository.delete(branch);

    }

    private BranchResponse toBranchResponse(Branch branch) {
        return new BranchResponse(
                branch.getId(),
                branch.getStore().getId(),
                branch.getBranchName(),
                branch.getRegion(),
                branch.getCity(),
                branch.getAddress(),
                branch.getPhone(),
                branch.getCreatedAt()
        );
    }
}


