package com.novel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.entity.Book;
import com.novel.entity.Chapter;
import com.novel.entity.User;
import com.novel.mapper.BookMapper;
import com.novel.mapper.ChapterMapper;
import com.novel.mapper.UserMapper;
import com.novel.service.AuthorBookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthorBookServiceImpl implements AuthorBookService {

    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private ChapterMapper chapterMapper;

    @Autowired
    private UserMapper userMapper;

    private User validateAuthor(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null || user.getIsAuthor() == null || user.getIsAuthor() != 1) {
            throw new IllegalArgumentException("您不是作者");
        }
        return user;
    }

    private Book validateBookOwnership(Long userId, Long bookId) {
        Book book = bookMapper.selectById(bookId);
        if (book == null) {
            throw new IllegalArgumentException("书籍不存在");
        }
        if (!userId.equals(book.getAuthorId())) {
            throw new IllegalArgumentException("无权操作此书籍");
        }
        return book;
    }

    @Override
    public Page<Book> getMyBooks(Long userId, int page, int pageSize) {
        validateAuthor(userId);
        QueryWrapper<Book> query = new QueryWrapper<>();
        query.eq("author_id", userId).orderByDesc("create_time");
        return bookMapper.selectPage(new Page<>(page, pageSize), query);
    }

    @Override
    @Transactional
    public Map<String, Object> createBook(Long userId, Map<String, Object> body) {
        User user = validateAuthor(userId);

        String title = (String) body.get("title");
        String category = (String) body.get("category");
        String description = (String) body.get("description");
        String cover = (String) body.get("cover");
        Integer priceType = body.get("priceType") != null ? ((Number) body.get("priceType")).intValue() : 0;
        Integer freeChapterCount = body.get("freeChapterCount") != null ? ((Number) body.get("freeChapterCount")).intValue() : 0;

        if (title == null || title.isEmpty()) {
            throw new IllegalArgumentException("书名不能为空");
        }

        Book book = new Book();
        book.setTitle(title);
        book.setAuthor(user.getPenName() != null ? user.getPenName() : user.getUsername());
        book.setCategory(category);
        book.setDescription(description);
        book.setCover(cover != null ? cover : "https://placehold.co/200x280/667eea/fff?text=" + title.substring(0, Math.min(2, title.length())));
        book.setPriceType(priceType);
        book.setAuthorId(userId);
        book.setFreeChapterCount(freeChapterCount);
        book.setChapterCount(0);
        book.setTotalWords(0);
        book.setClickCount(0);
        book.setCollectCount(0);
        book.setRating(0.0);
        book.setIsFinished(false);
        book.setStatus(1);
        book.setCreateTime(LocalDateTime.now());
        book.setUpdateTime(LocalDateTime.now());
        bookMapper.insert(book);

        Map<String, Object> result = new HashMap<>();
        result.put("id", book.getId());
        result.put("title", book.getTitle());
        result.put("message", "书籍创建成功");
        return result;
    }

    @Override
    @Transactional
    public String updateBook(Long userId, Long bookId, Map<String, Object> body) {
        Book book = validateBookOwnership(userId, bookId);

        if (body.get("title") != null) book.setTitle((String) body.get("title"));
        if (body.get("category") != null) book.setCategory((String) body.get("category"));
        if (body.get("description") != null) book.setDescription((String) body.get("description"));
        if (body.get("cover") != null) book.setCover((String) body.get("cover"));
        if (body.get("priceType") != null) book.setPriceType(((Number) body.get("priceType")).intValue());
        if (body.get("freeChapterCount") != null) book.setFreeChapterCount(((Number) body.get("freeChapterCount")).intValue());
        if (body.get("isFinished") != null) book.setIsFinished(Boolean.TRUE.equals(body.get("isFinished")));
        book.setUpdateTime(LocalDateTime.now());
        bookMapper.updateById(book);
        return "更新成功";
    }

    @Override
    public Page<Chapter> getChapters(Long userId, Long bookId, int page, int pageSize) {
        validateBookOwnership(userId, bookId);
        QueryWrapper<Chapter> query = new QueryWrapper<>();
        query.eq("book_id", bookId).orderByAsc("order_num");
        return chapterMapper.selectPage(new Page<>(page, pageSize), query);
    }

    @Override
    @Transactional
    public Map<String, Object> addChapter(Long userId, Long bookId, Map<String, Object> body) {
        Book book = validateBookOwnership(userId, bookId);

        String title = (String) body.get("title");
        String content = (String) body.get("content");
        Integer price = body.get("price") != null ? ((Number) body.get("price")).intValue() : 0;
        Integer isFree = body.get("isFree") != null ? ((Number) body.get("isFree")).intValue() : 1;

        if (title == null || title.isEmpty()) {
            throw new IllegalArgumentException("章节标题不能为空");
        }
        if (content == null || content.isEmpty()) {
            throw new IllegalArgumentException("章节内容不能为空");
        }

        QueryWrapper<Chapter> countQuery = new QueryWrapper<>();
        countQuery.eq("book_id", bookId);
        int chapterCount = Math.toIntExact(chapterMapper.selectCount(countQuery));
        int orderNum = chapterCount + 1;
        int wordCount = content.length();

        Chapter chapter = new Chapter();
        chapter.setBookId(bookId);
        chapter.setTitle(title);
        chapter.setContent(content);
        chapter.setOrderNum(orderNum);
        chapter.setWordCount(wordCount);
        chapter.setPrice(price);
        chapter.setIsFree(isFree);
        chapter.setCreateTime(LocalDateTime.now());
        chapter.setUpdateTime(LocalDateTime.now());
        chapterMapper.insert(chapter);

        book.setChapterCount(orderNum);
        book.setTotalWords((book.getTotalWords() != null ? book.getTotalWords() : 0) + wordCount);
        book.setLatestChapterName(title);
        book.setLatestChapterUpdateTime(LocalDateTime.now());
        book.setUpdateTime(LocalDateTime.now());
        bookMapper.updateById(book);

        Map<String, Object> result = new HashMap<>();
        result.put("id", chapter.getId());
        result.put("orderNum", orderNum);
        result.put("wordCount", wordCount);
        result.put("message", "章节添加成功");
        return result;
    }

    @Override
    @Transactional
    public String updateChapter(Long userId, Long bookId, Long chapterId, Map<String, Object> body) {
        Book book = validateBookOwnership(userId, bookId);

        Chapter chapter = chapterMapper.selectById(chapterId);
        if (chapter == null || !chapter.getBookId().equals(bookId)) {
            throw new IllegalArgumentException("章节不存在");
        }

        int oldWordCount = chapter.getWordCount() != null ? chapter.getWordCount() : 0;

        if (body.get("title") != null) chapter.setTitle((String) body.get("title"));
        if (body.get("content") != null) {
            String content = (String) body.get("content");
            chapter.setContent(content);
            chapter.setWordCount(content.length());
        }
        if (body.get("price") != null) chapter.setPrice(((Number) body.get("price")).intValue());
        if (body.get("isFree") != null) chapter.setIsFree(((Number) body.get("isFree")).intValue());
        chapter.setUpdateTime(LocalDateTime.now());
        chapterMapper.updateById(chapter);

        if (body.get("content") != null) {
            int newWordCount = chapter.getWordCount() != null ? chapter.getWordCount() : 0;
            int diff = newWordCount - oldWordCount;
            if (diff != 0) {
                book.setTotalWords((book.getTotalWords() != null ? book.getTotalWords() : 0) + diff);
                book.setUpdateTime(LocalDateTime.now());
                bookMapper.updateById(book);
            }
        }
        return "章节更新成功";
    }

    @Override
    @Transactional
    public String deleteChapter(Long userId, Long bookId, Long chapterId) {
        Book book = validateBookOwnership(userId, bookId);

        Chapter chapter = chapterMapper.selectById(chapterId);
        if (chapter == null || !chapter.getBookId().equals(bookId)) {
            throw new IllegalArgumentException("章节不存在");
        }

        int wordCount = chapter.getWordCount() != null ? chapter.getWordCount() : 0;
        chapterMapper.deleteById(chapterId);

        QueryWrapper<Chapter> countQuery = new QueryWrapper<>();
        countQuery.eq("book_id", bookId);
        int newCount = Math.toIntExact(chapterMapper.selectCount(countQuery));

        book.setChapterCount(newCount);
        book.setTotalWords(Math.max(0, (book.getTotalWords() != null ? book.getTotalWords() : 0) - wordCount));
        book.setUpdateTime(LocalDateTime.now());
        bookMapper.updateById(book);
        return "章节删除成功";
    }

    @Override
    public Map<String, Object> getBookStats(Long userId, Long bookId) {
        Book book = validateBookOwnership(userId, bookId);
        Map<String, Object> stats = new HashMap<>();
        stats.put("bookId", book.getId());
        stats.put("title", book.getTitle());
        stats.put("chapterCount", book.getChapterCount());
        stats.put("totalWords", book.getTotalWords());
        stats.put("clickCount", book.getClickCount());
        stats.put("collectCount", book.getCollectCount());
        stats.put("rating", book.getRating());
        return stats;
    }
}
