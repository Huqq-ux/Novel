package com.novel.interaction.service;

import com.novel.common.entity.BookList;
import com.novel.common.entity.BookListItem;

import java.util.List;

public interface BookListService {
    BookList createList(Long userId, String title, String description, String cover, Boolean isPublic);
    BookList updateList(Long userId, Long listId, String title, String description, String cover, Boolean isPublic);
    void deleteList(Long userId, Long listId);
    BookList getList(Long listId);
    List<BookList> getPublicLists(int page, int size, String sort);
    List<BookList> getMyLists(Long userId);

    BookListItem addItem(Long userId, Long listId, Long bookId);
    void removeItem(Long userId, Long listId, Long itemId);
    List<BookListItem> getItems(Long listId);
}
