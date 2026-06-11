package com.novel.reading.service.impl;

import com.novel.common.entity.Book;
import com.novel.common.entity.Bookshelf;
import com.novel.common.entity.Chapter;
import com.novel.reading.mapper.BookMapper;
import com.novel.reading.mapper.BookshelfMapper;
import com.novel.reading.mapper.ChapterMapper;
import com.novel.reading.service.BookshelfService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookshelfServiceImpl implements BookshelfService {

    private static final Logger logger = LoggerFactory.getLogger(BookshelfServiceImpl.class);

    @Autowired
    private BookshelfMapper bookshelfMapper;

    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private ChapterMapper chapterMapper;

    @Override
    public List<Bookshelf> getBookshelf(Long userId) {
        return bookshelfMapper.selectByUserId(userId);
    }

    @Override
    public boolean addToBookshelf(Long userId, Long bookId) {
        try {
            Bookshelf existing = bookshelfMapper.selectByUserIdAndBookId(userId, bookId);
            if (existing != null) {
                logger.info("Book already in bookshelf: userId={}, bookId={}", userId, bookId);
                return false;
            }
            Bookshelf bookshelf = new Bookshelf();
            bookshelf.setUserId(userId);
            bookshelf.setBookId(bookId);
            bookshelf.setLastReadTime(LocalDateTime.now());
            bookshelf.setProgress(0);
            bookshelfMapper.insert(bookshelf);
            logger.info("Book added to bookshelf: userId={}, bookId={}", userId, bookId);
            return true;
        } catch (DuplicateKeyException e) {
            logger.warn("Duplicate bookshelf entry: userId={}, bookId={}", userId, bookId);
            return false;
        } catch (Exception e) {
            logger.error("Error in addToBookshelf: {}", e.getMessage());
            throw new RuntimeException("添加到书架失败，请稍后重试");
        }
    }

    @Override
    public void removeFromBookshelf(Long userId, Long bookId) {
        int deleted = bookshelfMapper.deleteByUserIdAndBookId(userId, bookId);
        if (deleted > 0) {
            logger.info("Book removed from bookshelf: userId={}, bookId={}", userId, bookId);
        } else {
            logger.warn("Book not found in bookshelf: userId={}, bookId={}", userId, bookId);
        }
    }

    @Override
    public void updateProgress(Long userId, Long bookId, Long chapterId) {
        Bookshelf bookshelf = bookshelfMapper.selectByUserIdAndBookId(userId, bookId);

        if (bookshelf == null) {
            bookshelf = new Bookshelf();
            bookshelf.setUserId(userId);
            bookshelf.setBookId(bookId);
            bookshelf.setLastChapterId(chapterId);
            bookshelf.setLastReadTime(LocalDateTime.now());
            bookshelf.setProgress(0);
            bookshelfMapper.insert(bookshelf);
            logger.info("Created bookshelf entry and updated progress: userId={}, bookId={}, chapterId={}", userId, bookId, chapterId);
        } else {
            bookshelf.setLastChapterId(chapterId);
            bookshelf.setLastReadTime(LocalDateTime.now());
            bookshelfMapper.updateById(bookshelf);
            logger.info("Progress updated: userId={}, bookId={}, chapterId={}", userId, bookId, chapterId);
        }

        Book book = bookMapper.selectById(bookId);
        if (book != null && book.getChapterCount() != null && book.getChapterCount() > 0) {
            List<Chapter> chapters = chapterMapper.selectByBookIdOrderByOrderNum(bookId);
            if (chapters != null && !chapters.isEmpty()) {
                int chapterOrder = 0;
                for (int i = 0; i < chapters.size(); i++) {
                    if (chapters.get(i).getId().equals(chapterId)) {
                        chapterOrder = i + 1;
                        break;
                    }
                }
                int progress = (int) ((chapterOrder * 100.0) / chapters.size());
                bookshelf.setProgress(progress);
                bookshelfMapper.updateById(bookshelf);
                logger.info("Progress percentage updated: userId={}, bookId={}, progress={}%", userId, bookId, progress);
            }
        }
    }
}
