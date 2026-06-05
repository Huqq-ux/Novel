package com.novel.service.impl;

import com.novel.entity.Bookmark;
import com.novel.mapper.BookmarkMapper;
import com.novel.service.BookmarkService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class BookmarkServiceImpl implements BookmarkService {

    private static final Logger logger = LoggerFactory.getLogger(BookmarkServiceImpl.class);

    @Autowired
    private BookmarkMapper bookmarkMapper;

    @Override
    public List<Bookmark> getBookmarks(Long userId, Long bookId) {
        List<Bookmark> list = bookmarkMapper.selectByUserIdAndBookId(userId, bookId);
        return list != null ? list : Collections.emptyList();
    }

    @Override
    public boolean isBookmarked(Long userId, Long bookId, Long chapterId) {
        Bookmark existing = bookmarkMapper.selectByUserAndChapter(userId, bookId, chapterId);
        return existing != null;
    }

    @Override
    public Bookmark addBookmark(Long userId, Long bookId, Long chapterId, String chapterTitle, Integer position, String note) {
        try {
            Bookmark existing = bookmarkMapper.selectByUserAndChapter(userId, bookId, chapterId);
            if (existing != null) {
                logger.info("Bookmark already exists: userId={}, bookId={}, chapterId={}", userId, bookId, chapterId);
                return null;
            }
            Bookmark bookmark = new Bookmark();
            bookmark.setUserId(userId);
            bookmark.setBookId(bookId);
            bookmark.setChapterId(chapterId);
            bookmark.setChapterTitle(chapterTitle != null ? chapterTitle : "");
            bookmark.setPosition(position != null ? position : 0);
            bookmark.setNote(note);
            bookmark.setCreateTime(LocalDateTime.now());
            bookmarkMapper.insert(bookmark);
            logger.info("Bookmark added: userId={}, bookId={}, chapterId={}, id={}", userId, bookId, chapterId, bookmark.getId());
            return bookmark;
        } catch (DuplicateKeyException e) {
            logger.warn("Duplicate bookmark: userId={}, bookId={}, chapterId={}", userId, bookId, chapterId);
            return null;
        }
    }

    @Override
    public void deleteBookmark(Long userId, Long bookmarkId) {
        Bookmark bookmark = bookmarkMapper.selectById(bookmarkId);
        if (bookmark == null) {
            logger.warn("Bookmark not found: id={}", bookmarkId);
            return;
        }
        if (!bookmark.getUserId().equals(userId)) {
            logger.warn("User {} attempted to delete bookmark {} owned by {}", userId, bookmarkId, bookmark.getUserId());
            return;
        }
        bookmarkMapper.deleteById(bookmarkId);
        logger.info("Bookmark deleted: id={}, userId={}", bookmarkId, userId);
    }
}
