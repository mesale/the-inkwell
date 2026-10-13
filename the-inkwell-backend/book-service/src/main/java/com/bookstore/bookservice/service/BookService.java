package com.bookstore.bookservice.service;

import com.bookstore.bookservice.dto.BookDto.*;
import com.bookstore.bookservice.entity.Book;
import com.bookstore.bookservice.entity.Document;
import com.bookstore.bookservice.exception.ConflictException;
import com.bookstore.bookservice.exception.ResourceNotFoundException;
import com.bookstore.bookservice.exception.UnauthorizedException;
import com.bookstore.bookservice.repository.BookRepository;
import com.bookstore.bookservice.repository.DocumentRepository;
import jakarta.persistence.Table;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookService {

    private final BookRepository bookRepository;
    private final DocumentRepository documentRepository;
    private final MinioService minioService;

    public Page<BookSummaryResponse> getApprovedBooks(Pageable pageable){

        return bookRepository
                .findByApprovedTrue(pageable)
                .map(this::toBookSummaryResponse);

    }

    public Page<BookSummaryResponse> getApprovedBooksByCategory(String category, Pageable pageable){

        return bookRepository
                .findByApprovedTrueAndCategory(category, pageable)
                .map(this::toBookSummaryResponse);

    }

    public Page<BookSummaryResponse> searchBooks(String title, Pageable pageable){

        return bookRepository
                .findByApprovedTrueAndTitleContainingIgnoreCase(title, pageable)
                .map(this::toBookSummaryResponse);

    }

    public BookResponse  getBookById(UUID bookId){

         Book book = bookRepository.
                 findById(bookId).orElseThrow(() -> new ResourceNotFoundException("Book not found"));

         return toBookResponse(book);

    }

    public BookResponse createBookAsOwner(String keycloakId, UUID storeId, UUID branchId,
                                          CreateBookRequest request, MultipartFile image){
        Book book = Book.builder()
                .createdBy(storeId)
                .branchId(branchId)
                .storeId(storeId)
                .title(request.title())
                .author(request.author())
                .description(request.description())
                .category(request.category())
                .price(request.price())
                .condition(request.condition())
                .approved(true)
                .build();

        if (image != null && !image.isEmpty()){
            String objectName = "books/" + UUID.randomUUID() + "/"
                    + image.getOriginalFilename();
            UploadResult upload =  minioService.uploadImage(image, objectName);

            Document document = Document.builder()
                    .documentType(Document.DocumentType.BOOK_IMAGE)
                    .fileName(upload.fileName())
                    .contentType(upload.contentType())
                    .fileSize(upload.size())
                    .objectKey(upload.objectKey())
                    .bucketName(upload.bucketName())
                    .uploadedBy(storeId)
                    .isPrimary(true)
                    .build();

            document.setBook(book);
            book.getDocuments().add(document);

        }

        return toBookResponse(bookRepository.save(book));

    }

    public BookResponse createBookForBranch(UUID storeId, UUID branchId,
                                            CreateBookRequest request, MultipartFile image){
        Book book = Book.builder()
                .createdBy(storeId)
                .branchId(branchId)
                .storeId(storeId)
                .title(request.title())
                .author(request.author())
                .description(request.description())
                .category(request.category())
                .price(request.price())
                .condition(request.condition())
                .approved(true) // Store Admin uploads are pre-approved
                .build();

        if (image != null && !image.isEmpty()){
            String objectName = "books/" + UUID.randomUUID() + "/"
                    + image.getOriginalFilename();
            UploadResult upload =  minioService.uploadImage(image, objectName);

            Document document = Document.builder()
                    .documentType(Document.DocumentType.BOOK_IMAGE)
                    .fileName(upload.fileName())
                    .contentType(upload.contentType())
                    .fileSize(upload.size())
                    .objectKey(upload.objectKey())
                    .bucketName(upload.bucketName())
                    .uploadedBy(storeId)
                    .isPrimary(true)
                    .build();

            document.setBook(book);
            book.setDocuments(new ArrayList<>(List.of(document)));
        }

        return toBookResponse(bookRepository.save(book));
    }


    public BookResponse updateBookAsOwner(String keycloakId, UUID bookId, UUID storeId,
                                          UpdateBookRequest request, MultipartFile image){

        Book book = bookRepository.findByIdAndStoreId(bookId, storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        book.setTitle(request.title());
        book.setAuthor(request.author());
        book.setDescription(request.description());
        book.setCategory(request.category());
        book.setPrice(request.price());
        book.setCondition(request.condition());

        if (image != null && !image.isEmpty()){
            book.getDocuments().stream()
                    .filter(doc ->
                            doc.getDocumentType() == Document.DocumentType.BOOK_IMAGE &&
                                    Boolean.TRUE.equals(doc.getIsPrimary()))
                    .findFirst()
                    .ifPresent(existingImage ->{
                        minioService.deleteImage(existingImage.getObjectKey());
                        book.getDocuments().remove(existingImage);

                    });


            String objectName = "books/" + UUID.randomUUID() + "/"
                    + image.getOriginalFilename();
            UploadResult upload = minioService.uploadImage(image, objectName);

            Document document = Document.builder()
                    .documentType(Document.DocumentType.BOOK_IMAGE)
                    .fileName(upload.fileName())
                    .contentType(upload.contentType())
                    .fileSize(upload.size())
                    .objectKey(upload.objectKey())
                    .bucketName(upload.bucketName())
                    .uploadedBy(storeId)
                    .isPrimary(true)
                    .build();

            book.getDocuments().add(document);

        }

        return toBookResponse(bookRepository.save(book));

    }

    public void deleteBookAsOwner(String keycloakId, UUID storeId, UUID bookId){

        Book book = bookRepository.findByIdAndStoreId(bookId, storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        if (book.getDocuments() != null && !book.getDocuments().isEmpty())

            for(Document document : book.getDocuments())
                minioService.deleteImage(document.getObjectKey());

        bookRepository.delete(book);

    }

    public List<BookResponse> getStoreBooks(UUID storeId){
        return bookRepository
                .findByStoreId(storeId)
                .stream()
                .map(this::toBookResponse)
                .toList();
    }

    @Transactional
    public BookResponse createBookAsEmployee(String keycloakId, UUID branchId,
                                             UUID storeId, CreateBookRequest request, MultipartFile image) {

        Book book = Book.builder()
                .createdBy(branchId)
                .branchId(branchId)
                .storeId(storeId)
                .title(request.title())
                .author(request.author())
                .description(request.description())
                .category(request.category())
                .price(request.price())
                .condition(request.condition())
                .approved(false)
                .build();

        if (book.getDocuments() == null)
            book.setDocuments(new ArrayList<>());

        book = bookRepository.save(book);

        if (image != null && !image.isEmpty()) {
            String objectName = "books/" + UUID.randomUUID() + "/"
                    + image.getOriginalFilename();
            UploadResult upload =  minioService.uploadImage(image, objectName);

            Document document = Document.builder()
                    .documentType(Document.DocumentType.BOOK_IMAGE)
                    .book(book)
                    .fileName(upload.fileName())
                    .contentType(upload.contentType())
                    .fileSize(upload.size())
                    .objectKey(upload.objectKey())
                    .bucketName(upload.bucketName())
                    .uploadedBy(storeId)
                    .isPrimary(true)
                    .build();

            book.getDocuments().add(document);
        }
        Book savedBook = bookRepository.save(book);

        return toBookResponse(savedBook);
    }

    public BookResponse updateBookAsEmployee(String keycloakId, UUID branchId,
                                             UUID bookId, UpdateBookRequest request, MultipartFile image) {

        Book book = bookRepository.findByIdAndBranchId(bookId, branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        book.setTitle(request.title());
        book.setAuthor(request.author());
        book.setDescription(request.description());
        book.setCategory(request.category());
        book.setPrice(request.price());
        book.setCondition(request.condition());

        if (image != null && !image.isEmpty()) {
            book.getDocuments().stream()
                    .filter(doc ->
                            doc.getDocumentType() == Document.DocumentType.BOOK_IMAGE &&
                                    Boolean.TRUE.equals(doc.getIsPrimary()))
                    .findFirst()
                    .ifPresent(existingImage ->{
                        minioService.deleteImage(existingImage.getObjectKey());
                        book.getDocuments().remove(existingImage);

                    });
            String objectName = "books/" + UUID.randomUUID() + "/"
                    + image.getOriginalFilename();

            UploadResult upload = minioService.uploadImage(image, objectName);

            Document document = Document.builder()
                    .documentType(Document.DocumentType.BOOK_IMAGE)
                    .fileName(upload.fileName())
                    .contentType(upload.contentType())
                    .fileSize(upload.size())
                    .objectKey(upload.objectKey())
                    .bucketName(upload.bucketName())
                    .uploadedBy(branchId)
                    .isPrimary(true)
                    .build();

            book.getDocuments().add(document);
        }

        return toBookResponse(bookRepository.save(book));
    }

    public void deleteBookAsEmployee(UUID branchId, UUID bookId) {
        Book book = bookRepository.findByIdAndBranchId(bookId, branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        if (book.getDocuments() != null && !book.getDocuments().isEmpty()) {

            for (Document document : book.getDocuments())
                minioService.deleteImage(document.getObjectKey());
        }

        bookRepository.delete(book);
    }

    public List<BookResponse> getBranchBooks(UUID branchId) {
        return bookRepository.findByBranchId(branchId)
                .stream()
                .map(this::toBookResponse)
                .toList();
    }

    public long getBranchBooksCount(UUID branchId){
        return bookRepository.countByBranchId(branchId);
    }

    public Page<BookResponse> getUnapprovedBooksForStore(Pageable pageable){

        return bookRepository
                .findByApprovedFalse(pageable)
                .map(this::toBookResponse);

    }

    public BookResponse approveBookAsOwner(UUID storeId, UUID bookId){

        Book book = bookRepository.findByIdAndStoreId(bookId, storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        book.setApproved(true);

        return toBookResponse(bookRepository.save(book));

    }

    public void rejectBookAsOwner(UUID storeId, UUID bookId){

        Book book = bookRepository.findByIdAndStoreId(bookId, storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        if(book.isApproved())
            throw new ConflictException("Cannot reject already approved book");

        if(book.getDocuments() != null && !book.getDocuments().isEmpty())
            for (Document document : book.getDocuments())
                minioService.deleteImage(document.getObjectKey());

        bookRepository.delete(book);

    }

    public void removeBookAsAdmin(UUID bookId){

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        if (book.getDocuments() != null && !book.getDocuments().isEmpty())
            for (Document document : book.getDocuments())
                minioService.deleteImage(document.getObjectKey());

        bookRepository.delete(book);

    }

    private String extractObjectName(String imageUrl) {
        // URL format: http://localhost:9000/bucket-name/books/uuid/filename.jpg
        // We need: books/uuid/filename.jpg
        return imageUrl.substring(imageUrl.indexOf("books/"));
    }

    private BookResponse toBookResponse(Book book) {

        return new BookResponse(
                book.getId(),
                book.getCreatedBy(),
                book.getBranchId(),
                book.getStoreId(),
                book.getTitle(),
                book.getAuthor(),
                book.getDescription(),
                book.getCategory(),
                book.getPrice(),
                book.getDocuments().stream().map(this::toDocumentResponse).toList(),
                book.getCondition().name(),
                book.isApproved(),
                book.getCreatedAt()
        );

    }

    private DocumentResponse toDocumentResponse(Document document){
        return new DocumentResponse(
                document.getId(),
                document.getDocumentType(),
                minioService.getFileUrl(document.getBucketName(), document.getObjectKey()),
                document.getFileName(),
                document.getUploadedBy()
        );
    }

    private BookSummaryResponse toBookSummaryResponse(Book book) {

        return new BookSummaryResponse(
                book.getId(),
                book.getBranchId(),
                book.getTitle(),
                book.getAuthor(),
                book.getCategory(),
                book.getPrice(),
                book.getCondition().name(),
                book.getDocuments().stream().map(this::toDocumentResponse).toList()
        );

    }
}
