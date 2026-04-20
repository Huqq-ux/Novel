package com.novel.module.reading.service.impl;

import com.novel.module.reading.entity.BookshelfEntity;
import com.novel.module.reading.mapper.BookshelfEntityMapper;
import com.novel.module.reading.service.ReadingDomainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReadingDomainServiceImpl implements ReadingDomainService {

    @Autowired
    private BookshelfEntityMapper bookshelfMapper;

    @Override
    @Transactional
    public BookshelfEntity addToBookshelf(Long userId, Long bookId) {
        Optional<BookshelfEntity> existing = bookshelfMapper.findByUserIdAndBookId(userId, bookId);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        BookshelfEntity bookshelf = new BookshelfEntity();
        bookshelf.setUserId(userId);
        bookshelf.setBookId(bookId);
        bookshelf.setReadProgress(0.0);
        bookshelf.setCreateTime(LocalDateTime.now());
        bookshelf.setLastReadTime(LocalDateTime.now());
        bookshelfMapper.insert(bookshelf);
        return bookshelf;
    }

    @Override
    public Optional<BookshelfEntity> findByUserIdAndBookId(Long userId, Long bookId) {
        return bookshelfMapper.findByUserIdAndBookId(userId, bookId);
    }

    @Override
    public List<BookshelfEntity> findByUserId(Long userId) {
        return bookshelfMapper.findByUserIdOrderByLastReadTimeDesc(userId);
    }

    @Override
    @Transactional
    public void updateReadingProgress(Long userId, Long bookId, Long chapterId, Double progress) {
        Optional<BookshelfEntity> bookshelfOpt = bookshelfMapper.findByUserIdAndBookId(userId, bookId);
        
        if (bookshelfOpt.isPresent()) {
            BookshelfEntity bookshelf = bookshelfOpt.get();
            bookshelf.setLastChapterId(chapterId);
            bookshelf.setReadProgress(progress);
            bookshelf.setLastReadTime(LocalDateTime.now());
            bookshelfMapper.updateById(bookshelf);
        } else {
            BookshelfEntity bookshelf = new BookshelfEntity();
            bookshelf.setUserId(userId);
            bookshelf.setBookId(bookId);
            bookshelf.setLastChapterId(chapterId);
            bookshelf.setReadProgress(progress);
            bookshelf.setCreateTime(LocalDateTime.now());
            bookshelf.setLastReadTime(LocalDateTime.now());
            bookshelfMapper.insert(bookshelf);
        }
    }

    @Override
    @Transactional
    public void removeFromBookshelf(Long userId, Long bookId) {
        Optional<BookshelfEntity> bookshelf = bookshelfMapper.findByUserIdAndBookId(userId, bookId);
        bookshelf.ifPresent(b -> bookshelfMapper.deleteById(b.getId()));
    }

    @Override
    public boolean isInBookshelf(Long userId, Long bookId) {
        return bookshelfMapper.findByUserIdAndBookId(userId, bookId).isPresent();
    }

    @Override
    public int getBookshelfCount(Long userId) {
        return bookshelfMapper.countByUserId(userId);
    }
}
