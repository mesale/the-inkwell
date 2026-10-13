package com.bookstore.bookservice.service;

import com.bookstore.bookservice.dto.BookDto;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.external.url}")
    private String minioExternalUrl;

    public BookDto.UploadResult uploadImage(MultipartFile file, String objectName){

        try{

            boolean bucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build()
            );

            if(!bucketExists){

                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());

                minioClient.setBucketPolicy(
                        SetBucketPolicyArgs.builder()
                                .bucket(bucketName)
                                .config(buildPublicReadPolicy(bucketName))
                                .build()
                );

                log.info("Created bucket: {}", bucketName);


            }

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(file.getInputStream(),file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("Uploaded image: {}", objectName);
            return new BookDto.UploadResult(
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getSize(),
                    objectName,
                    bucketName
            );

        }catch (Exception e){
            log.error("Failed to upload image: {}", objectName, e);
            throw  new RuntimeException("Failed to upload image to MinIo");
        }

    }

    public void deleteImage(String objectName){

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            log.info("Deleted image: {}", objectName);

        }catch (Exception e){
            log.error("Failed to delete image: {}", objectName, e);
            throw new RuntimeException("Failed to delete image from MinIo");
        }

    }

    public String getFileUrl(String bucketName, String objectKey) {
        return minioExternalUrl + "/" + bucketName + "/" + objectKey;
    }

    public String buildPublicReadPolicy(String bucketName){
        return """
                {
                    "version": 2012-10-17,
                    "Statement":[
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": ["*"]},
                            "Action": ["s3:GetObject"],
                            "Resource": ["arn:aws:s3:::%s/*"]
                        }
                    ]
                }
                """.formatted(bucketName);
    }

}
