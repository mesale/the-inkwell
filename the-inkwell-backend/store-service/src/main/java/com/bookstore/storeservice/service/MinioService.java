package com.bookstore.storeservice.service;

import com.bookstore.storeservice.dto.StoreDto.UploadResult;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucket;

    @Value("${minio.url}")
    private String minioUrl;

    public UploadResult uploadFile(MultipartFile file, String folder) {
        try {

            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("File is missing or empty");
            }

            String originalName = file.getOriginalFilename();

            if (originalName == null || originalName.isBlank()) {
                originalName = "upload";
            }

            String extension = getExtension(originalName);
            String objectName = folder + "/" + UUID.randomUUID() + extension;

            String contentType = file.getContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "application/octet-stream"; // fallback
            }

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(contentType)
                            .build()
            );

            String url = minioUrl + "/" + bucket + "/" + objectName;
            log.info("Uploaded file to MinIO: {}", url);
            return new UploadResult(
                    originalName,
                    contentType,
                    file.getSize(),
                    objectName,
                    bucket
            );

        } catch (Exception e) {
            log.error("Failed to upload file to MinIO", e);
            throw new RuntimeException("File upload failed: " + e.getMessage());
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }
}