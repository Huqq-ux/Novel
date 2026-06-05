package com.novel.service.impl;

import com.novel.entity.BookList;
import com.novel.entity.BookListItem;
import com.novel.mapper.BookListMapper;
import com.novel.mapper.BookListItemMapper;
import com.novel.service.BookListService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class BookListServiceImpl implements BookListService {

    private static final Logger logger = LoggerFactory.getLogger(BookListServiceImpl.class);

    @Autowired
    private BookListMapper bookListMapper;
    @Autowired
    private BookListItemMapper bookListItemMapper;

    @Override
    public BookList createList(Long userId, String title, String description, String cover, Boolean isPublic) {
        BookList bookList = new BookList();
        bookList.setUserId(userId);
        bookList.setTitle(title);
        bookList.setDescription(description != null ? description : "");
        bookList.setCover(cover);
        bookList.setIsPublic(isPublic != null && isPublic ? 1 : 0);
        bookList.setLikeCount(0);
        bookList.setBookCount(0);
        bookList.setCreateTime(LocalDateTime.now());
        bookList.setUpdateTime(LocalDateTime.now());
        bookListMapper.insert(bookList);
        return bookList;
    }

    @Override
    public BookList updateList(Long userId, Long listId, String title, String description, String cover, Boolean isPublic) {
        BookList bookList = bookListMapper.selectById(listId);
        if (bookList == null) throw new RuntimeException("书单不存在");
        if (!bookList.getUserId().equals(userId)) throw new RuntimeException("无权编辑此书单");
        if (title != null) bookList.setTitle(title);
        if (description != null) bookList.setDescription(description);
        if (cover != null) bookList.setCover(cover);
        if (isPublic != null) bookList.setIsPublic(isPublic ? 1 : 0);
        bookList.setUpdateTime(LocalDateTime.now());
        bookListMapper.updateById(bookList);
        return bookList;
    }

    @Override
    @Transactional
    public void deleteList(Long userId, Long listId) {
        BookList bookList = bookListMapper.selectById(listId);
        if (bookList == null) return;
        if (!bookList.getUserId().equals(userId)) throw new RuntimeException("无权删除此书单");
        bookListItemMapper.selectByListId(listId).forEach(item -> bookListItemMapper.deleteById(item.getId()));
        bookListMapper.deleteById(listId);
    }

    @Override
    public BookList getList(Long listId) {
        return bookListMapper.selectById(listId);
    }

    @Override
    public List<BookList> getPublicLists(int page, int size, String sort) {
        int offset = (page - 1) * size;
        return bookListMapper.selectPublicLists(offset, size, sort != null ? sort : "newest");
    }

    @Override
    public List<BookList> getMyLists(Long userId) {
        List<BookList> list = bookListMapper.selectByUserId(userId);
        return list != null ? list : Collections.emptyList();
    }

    @Override
    @Transactional
    public BookListItem addItem(Long userId, Long listId, Long bookId) {
        BookList bookList = bookListMapper.selectById(listId);
        if (bookList == null) throw new RuntimeException("书单不存在");
        if (!bookList.getUserId().equals(userId)) throw new RuntimeException("无权编辑此书单");
        BookListItem existing = bookListItemMapper.selectByListIdAndBookId(listId, bookId);
        if (existing != null) throw new RuntimeException("该书籍已在书单中");

        BookListItem item = new BookListItem();
        item.setListId(listId);
        item.setBookId(bookId);
        item.setSortOrder(0);
        item.setAddTime(LocalDateTime.now());
        bookListItemMapper.insert(item);

        bookList.setBookCount(bookListItemMapper.countByListId(listId));
        bookList.setUpdateTime(LocalDateTime.now());
        bookListMapper.updateById(bookList);
        return item;
    }

    @Override
    @Transactional
    public void removeItem(Long userId, Long listId, Long itemId) {
        BookList bookList = bookListMapper.selectById(listId);
        if (bookList == null) return;
        if (!bookList.getUserId().equals(userId)) throw new RuntimeException("无权编辑此书单");
        bookListItemMapper.deleteById(itemId);

        bookList.setBookCount(bookListItemMapper.countByListId(listId));
        bookList.setUpdateTime(LocalDateTime.now());
        bookListMapper.updateById(bookList);
    }

    @Override
    public List<BookListItem> getItems(Long listId) {
        List<BookListItem> list = bookListItemMapper.selectByListId(listId);
        return list != null ? list : Collections.emptyList();
    }
}
