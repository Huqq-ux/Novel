package com.novel.book.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
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

    private static final int MAX_ORIGINAL_WIDTH = 800;
    private static final int THUMB_MD_WIDTH = 200;
    private static final int THUMB_SM_WIDTH = 80;

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
        String baseName = generateBaseName();

        Path targetPath = uploadDir.resolve(baseName + "." + extension);

        BufferedImage sourceImage;
        try (InputStream is = file.getInputStream()) {
            BufferedImage img = ImageIO.read(is);
            if (img != null) {
                sourceImage = img;
            } else {
                sourceImage = null;
            }
        }

        if (sourceImage != null) {
            int srcWidth = sourceImage.getWidth();
            int srcHeight = sourceImage.getHeight();

            int origTargetW = Math.min(srcWidth, MAX_ORIGINAL_WIDTH);
            int origTargetH = (int) ((double) srcHeight / srcWidth * origTargetW);
            BufferedImage originalScaled = resizeImage(sourceImage, origTargetW, origTargetH);
            saveAsJpeg(originalScaled, uploadDir.resolve(baseName + ".jpg"));
            String savedExt = "jpg";

            int mdW = Math.min(srcWidth, THUMB_MD_WIDTH);
            int mdH = (int) ((double) srcHeight / srcWidth * mdW);
            BufferedImage mdThumb = resizeImage(sourceImage, mdW, mdH);
            saveAsJpeg(mdThumb, uploadDir.resolve(baseName + "_md.jpg"));

            int smW = Math.min(srcWidth, THUMB_SM_WIDTH);
            int smH = (int) ((double) srcHeight / srcWidth * smW);
            BufferedImage smThumb = resizeImage(sourceImage, smW, smH);
            saveAsJpeg(smThumb, uploadDir.resolve(baseName + "_sm.jpg"));

            if (!"jpg".equalsIgnoreCase(extension) && !"jpeg".equalsIgnoreCase(extension)) {
                String origPath = uploadDir.resolve(baseName + "." + extension).toString();
                if (Files.exists(Paths.get(origPath))) {
                    Files.delete(Paths.get(origPath));
                }
            }

            return "/uploads/" + category + "/" + baseName + "." + savedExt;
        } else {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + category + "/" + baseName + "." + extension;
        }
    }

    public String uploadBookCover(MultipartFile file) throws IOException {
        return uploadImage(file, "covers");
    }

    public String uploadUserAvatar(MultipartFile file) throws IOException {
        return uploadImage(file, "avatars");
    }

    private BufferedImage resizeImage(BufferedImage source, int targetWidth, int targetHeight) {
        Image scaled = source.getScaledInstance(targetWidth, targetHeight, Image.SCALE_SMOOTH);
        BufferedImage result = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = result.createGraphics();
        g2d.drawImage(scaled, 0, 0, null);
        g2d.dispose();
        return result;
    }

    private void saveAsJpeg(BufferedImage image, Path targetPath) throws IOException {
        ImageIO.write(image, "jpeg", targetPath.toFile());
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

    private String generateBaseName() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return timestamp + "_" + uuid;
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

            String baseName = extractBaseName(filePath);
            Path parentDir = filePath.getParent();

            if (parentDir != null) {
                String[] suffixes = {"", "_md", "_sm"};
                String[] extensions = {"jpg", "jpeg", "png", "gif", "webp"};
                for (String suffix : suffixes) {
                    for (String ext : extensions) {
                        Path variant = parentDir.resolve(baseName + suffix + "." + ext);
                        if (Files.exists(variant)) {
                            Files.delete(variant);
                        }
                    }
                }
            }

            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private String extractBaseName(Path filePath) {
        String filename = filePath.getFileName().toString();
        for (String suffix : new String[]{"_md", "_sm"}) {
            if (filename.contains(suffix)) {
                filename = filename.replace(suffix, "");
            }
        }
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0) {
            filename = filename.substring(0, lastDot);
        }
        return filename;
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
