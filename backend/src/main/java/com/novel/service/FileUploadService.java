package com.novel.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {

    @Value("${file.upload.path:uploads}")
    private String uploadPath;

    @Value("${file.upload.max-size:5242880}")
    private long maxFileSize;

    private static final Set<String> ALLOWED_IMAGE_TYPES = new HashSet<>(
            Arrays.asList("image/jpeg", "image/png", "image/gif", "image/webp")
    );

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(
            Arrays.asList("jpg", "jpeg", "png", "gif", "webp")
    );

    public String uploadImage(MultipartFile file, String category) throws IOException {
        validateFile(file);
        
        Path uploadDir = Paths.get(uploadPath, category).toAbsolutePath().normalize();
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String newFilename = generateFilename(extension);
        
        Path targetPath = uploadDir.resolve(newFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/" + category + "/" + newFilename;
    }

    public String uploadBookCover(MultipartFile file) throws IOException {
        return uploadImage(file, "covers");
    }

    public String uploadUserAvatar(MultipartFile file) throws IOException {
        return uploadImage(file, "avatars");
    }

    private void validateFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("文件不能为空");
        }

        if (file.getSize() > maxFileSize) {
            throw new IOException("文件大小超过限制，最大允许 " + (maxFileSize / 1024 / 1024) + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IOException("不支持的文件类型，仅支持 JPG、PNG、GIF、WEBP 格式");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IOException("文件名无效");
        }

        String extension = getFileExtension(originalFilename);
        if (extension == null || !ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IOException("不支持的文件扩展名");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return null;
        }
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return null;
        }
        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    private String generateFilename(String extension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return timestamp + "_" + uuid + "." + extension;
    }

    public boolean deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return false;
        }
        
        if (!fileUrl.startsWith("/uploads/")) {
            return false;
        }

        try {
            String relativePath = fileUrl.substring("/uploads/".length());
            Path filePath = Paths.get(uploadPath, relativePath).toAbsolutePath().normalize();
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return true;
            }
        } catch (IOException e) {
            return false;
        }
        
        return false;
    }

    public boolean isValidImageUrl(String url) {
        if (url == null || url.isEmpty()) {
            return false;
        }

        if (url.startsWith("/uploads/")) {
            Path filePath = Paths.get(uploadPath, url.substring("/uploads/".length())).toAbsolutePath().normalize();
            return Files.exists(filePath);
        }

        return url.startsWith("http://") || url.startsWith("https://");
    }
}
