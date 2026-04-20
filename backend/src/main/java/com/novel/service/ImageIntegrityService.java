package com.novel.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.novel.entity.Book;
import com.novel.mapper.BookMapper;
import com.novel.util.ImageValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ImageIntegrityService {

    private static final Logger logger = LoggerFactory.getLogger(ImageIntegrityService.class);

    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private ImageValidator imageValidator;

    private final Map<Long, Boolean> bookCoverStatus = new ConcurrentHashMap<>();

    public Map<String, Object> checkBookCover(Long bookId) {
        Book book = bookMapper.selectById(bookId);
        if (book == null) {
            return Map.of(
                "valid", false,
                "message", "书籍不存在"
            );
        }

        String cover = book.getCover();
        boolean isValid = imageValidator.isValidImageUrl(cover);
        
        bookCoverStatus.put(bookId, isValid);

        return Map.of(
            "valid", isValid,
            "bookId", bookId,
            "title", book.getTitle(),
            "cover", cover != null ? cover : "",
            "message", isValid ? "封面图片有效" : "封面图片无效或缺失"
        );
    }

    public Map<String, Object> checkAllBookCovers() {
        QueryWrapper<Book> query = new QueryWrapper<>();
        query.select("id", "title", "cover", "category");
        List<Book> books = bookMapper.selectList(query);

        int total = books.size();
        int valid = 0;
        int invalid = 0;
        int missing = 0;

        for (Book book : books) {
            String cover = book.getCover();
            if (cover == null || cover.isEmpty()) {
                missing++;
                bookCoverStatus.put(book.getId(), false);
            } else if (imageValidator.isValidImageUrl(cover)) {
                valid++;
                bookCoverStatus.put(book.getId(), true);
            } else {
                invalid++;
                bookCoverStatus.put(book.getId(), false);
            }
        }

        return Map.of(
            "total", total,
            "valid", valid,
            "invalid", invalid,
            "missing", missing,
            "timestamp", LocalDateTime.now().toString()
        );
    }

    public List<Map<String, Object>> getInvalidBooks() {
        QueryWrapper<Book> query = new QueryWrapper<>();
        query.select("id", "title", "cover", "category", "author");
        List<Book> books = bookMapper.selectList(query);

        return books.stream()
            .filter(book -> {
                String cover = book.getCover();
                return cover == null || cover.isEmpty() || !imageValidator.isValidImageUrl(cover);
            })
            .map(book -> Map.<String, Object>of(
                "id", book.getId(),
                "title", book.getTitle(),
                "cover", book.getCover() != null ? book.getCover() : "",
                "category", book.getCategory() != null ? book.getCategory() : "",
                "author", book.getAuthor() != null ? book.getAuthor() : "",
                "suggestedCover", imageValidator.getFallbackCoverUrl(book.getTitle(), book.getCategory())
            ))
            .toList();
    }

    public int fixMissingCovers() {
        QueryWrapper<Book> query = new QueryWrapper<>();
        query.select("id", "title", "cover", "category");
        List<Book> books = bookMapper.selectList(query);

        int fixed = 0;
        for (Book book : books) {
            String cover = book.getCover();
            if (cover == null || cover.isEmpty() || !imageValidator.isValidImageUrl(cover)) {
                String newCover = imageValidator.getFallbackCoverUrl(book.getTitle(), book.getCategory());
                book.setCover(newCover);
                bookMapper.updateById(book);
                fixed++;
                logger.info("Fixed cover for book {}: {}", book.getId(), newCover);
            }
        }

        return fixed;
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduledCoverCheck() {
        logger.info("Starting scheduled book cover integrity check...");
        Map<String, Object> result = checkAllBookCovers();
        logger.info("Cover check completed: {}", result);
    }

    public void clearCache() {
        bookCoverStatus.clear();
        imageValidator.clearCache();
    }
}
