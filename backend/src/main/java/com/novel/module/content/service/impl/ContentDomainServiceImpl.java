package com.novel.module.content.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.novel.module.content.entity.BookEntity;
import com.novel.module.content.entity.ChapterEntity;
import com.novel.module.content.mapper.BookEntityMapper;
import com.novel.module.content.mapper.ChapterEntityMapper;
import com.novel.module.content.service.ContentDomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ContentDomainServiceImpl implements ContentDomainService {

    @Autowired
    private BookEntityMapper bookMapper;

    @Autowired
    private ChapterEntityMapper chapterMapper;

    @Override
    @Transactional
    public BookEntity createBook(BookEntity book) {
        book.setCreateTime(LocalDateTime.now());
        book.setUpdateTime(LocalDateTime.now());
        book.setClickCount(0);
        book.setCollectCount(0);
        if (book.getRating() == null) {
            book.setRating(0.0);
        }
        if (book.getPriceType() == null) {
            book.setPriceType(0);
        }
        bookMapper.insert(book);
        return book;
    }

    @Override
    public Optional<BookEntity> findBookById(Long id) {
        return Optional.ofNullable(bookMapper.selectById(id));
    }

    @Override
    @Transactional
    public BookEntity updateBook(BookEntity book) {
        book.setUpdateTime(LocalDateTime.now());
        bookMapper.updateById(book);
        return book;
    }

    @Override
    @Transactional
    public void updateBookRating(Long bookId, Double rating) {
        bookMapper.updateRating(bookId, rating);
    }

    @Override
    @Transactional
    public void incrementClickCount(Long bookId) {
        bookMapper.incrementClickCount(bookId);
    }

    @Override
    @Transactional
    public void incrementCollectCount(Long bookId) {
        bookMapper.incrementCollectCount(bookId);
    }

    @Override
    @Transactional
    public void decrementCollectCount(Long bookId) {
        bookMapper.decrementCollectCount(bookId);
    }

    @Override
    @Transactional
    public ChapterEntity createChapter(ChapterEntity chapter) {
        chapter.setCreateTime(LocalDateTime.now());
        chapter.setUpdateTime(LocalDateTime.now());
        if (chapter.getIsFree() == null) {
            chapter.setIsFree(0);
        }
        if (chapter.getPrice() == null) {
            chapter.setPrice(0);
        }
        chapterMapper.insert(chapter);
        return chapter;
    }

    @Override
    public Optional<ChapterEntity> findChapterById(Long id) {
        return Optional.ofNullable(chapterMapper.selectById(id));
    }

    @Override
    public List<ChapterEntity> findChaptersByBookId(Long bookId) {
        return chapterMapper.findByBookIdOrderByOrderNum(bookId);
    }

    @Override
    @Transactional
    public ChapterEntity updateChapter(ChapterEntity chapter) {
        chapter.setUpdateTime(LocalDateTime.now());
        chapterMapper.updateById(chapter);
        return chapter;
    }

    @Override
    public boolean isChapterFree(Long bookId, Long chapterId) {
        BookEntity book = bookMapper.selectById(bookId);
        if (book == null || book.getPriceType() == null || book.getPriceType() == 0) {
            return true;
        }
        
        ChapterEntity chapter = chapterMapper.selectById(chapterId);
        if (chapter == null) {
            return false;
        }
        
        if (chapter.getIsFree() != null && chapter.getIsFree() == 1) {
            return true;
        }
        
        Integer freeChapterCount = book.getFreeChapterCount();
        if (freeChapterCount != null && freeChapterCount > 0) {
            return chapter.getOrderNum() != null && chapter.getOrderNum() <= freeChapterCount;
        }
        
        return false;
    }

    @Override
    public Integer getChapterPrice(Long bookId, Long chapterId) {
        if (isChapterFree(bookId, chapterId)) {
            return 0;
        }
        
        ChapterEntity chapter = chapterMapper.selectById(chapterId);
        if (chapter != null && chapter.getPrice() != null) {
            return chapter.getPrice();
        }
        
        return 10;
    }
}
