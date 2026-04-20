package com.novel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.novel.entity.Book;
import com.novel.entity.Chapter;
import com.novel.entity.ChapterUnlock;
import com.novel.entity.User;
import com.novel.mapper.BookMapper;
import com.novel.mapper.ChapterMapper;
import com.novel.mapper.ChapterUnlockMapper;
import com.novel.mapper.UserMapper;
import com.novel.service.UnlockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UnlockServiceImpl implements UnlockService {

    @Autowired
    private ChapterMapper chapterMapper;

    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private ChapterUnlockMapper chapterUnlockMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    public Map<String, Object> getUnlockStatus(Long userId, Long bookId, Long chapterId) {
        Book book = bookMapper.selectById(bookId);
        if (book == null) {
            throw new IllegalArgumentException("书籍不存在");
        }
        Chapter chapter = chapterMapper.selectById(chapterId);
        if (chapter == null) {
            throw new IllegalArgumentException("章节不存在");
        }

        boolean isFree = chapter.getIsFree() != null && chapter.getIsFree() == 1;
        boolean isPaidBook = book.getPriceType() != null && book.getPriceType() == 1;

        Map<String, Object> result = new HashMap<>();
        if (!isPaidBook || isFree) {
            result.put("needUnlock", false);
            result.put("isFree", true);
            return result;
        }

        if (userId == null) {
            result.put("needUnlock", true);
            result.put("isFree", false);
            result.put("price", chapter.getPrice() != null ? chapter.getPrice() : 10);
            result.put("unlocked", false);
            return result;
        }

        boolean unlocked = isChapterUnlocked(userId, chapterId);
        result.put("needUnlock", !unlocked);
        result.put("isFree", false);
        result.put("price", chapter.getPrice() != null ? chapter.getPrice() : 10);
        result.put("unlocked", unlocked);
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> unlockChapter(Long userId, Long chapterId) {
        Chapter chapter = chapterMapper.selectById(chapterId);
        if (chapter == null) {
            throw new IllegalArgumentException("章节不存在");
        }

        Book book = bookMapper.selectById(chapter.getBookId());
        if (book == null) {
            throw new IllegalArgumentException("书籍不存在");
        }

        if (book.getPriceType() == null || book.getPriceType() == 0) {
            throw new IllegalArgumentException("该书籍为免费书籍");
        }

        if (chapter.getIsFree() != null && chapter.getIsFree() == 1) {
            throw new IllegalArgumentException("该章节为免费章节");
        }

        if (isChapterUnlocked(userId, chapterId)) {
            throw new IllegalArgumentException("该章节已解锁");
        }

        int price = chapter.getPrice() != null ? chapter.getPrice() : 10;

        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }

        int balance = user.getCoinBalance() != null ? user.getCoinBalance() : 0;
        if (balance < price) {
            throw new IllegalArgumentException("书币不足，请先充值");
        }

        user.setCoinBalance(balance - price);
        userMapper.updateById(user);

        ChapterUnlock unlock = new ChapterUnlock();
        unlock.setUserId(userId);
        unlock.setBookId(chapter.getBookId());
        unlock.setChapterId(chapterId);
        unlock.setPrice(price);
        unlock.setCreateTime(LocalDateTime.now());
        chapterUnlockMapper.insert(unlock);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("price", price);
        result.put("remainingBalance", user.getCoinBalance());
        return result;
    }

    @Override
    public List<Long> getUnlockedChapterIds(Long userId, Long bookId) {
        if (userId == null) {
            return new ArrayList<>();
        }
        QueryWrapper<ChapterUnlock> query = new QueryWrapper<>();
        query.eq("user_id", userId).eq("book_id", bookId);
        List<ChapterUnlock> unlocks = chapterUnlockMapper.selectList(query);
        List<Long> chapterIds = new ArrayList<>();
        for (ChapterUnlock unlock : unlocks) {
            chapterIds.add(unlock.getChapterId());
        }
        return chapterIds;
    }

    @Override
    public boolean isChapterUnlocked(Long userId, Long chapterId) {
        QueryWrapper<ChapterUnlock> query = new QueryWrapper<>();
        query.eq("user_id", userId).eq("chapter_id", chapterId);
        return chapterUnlockMapper.selectCount(query) > 0;
    }
}
