package com.novel.admin.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.common.entity.Book;
import com.novel.common.entity.User;

import java.util.Map;

public interface AdminService {
    Page<User> getUsers(int page, int pageSize, String keyword, String role, Integer status);
    String updateUserStatus(Long id, Integer status);
    String updateUserRole(Long id, String role);
    Map<String, Object> getStats();
    Page<Book> getBooks(int page, int pageSize, String keyword, String category, Integer status, Integer priceType);
    Map<String, Object> addPaidBook(Map<String, Object> body);
    String updatePaidBook(Long id, Map<String, Object> body);
    String updateBookStatus(Long id, Integer status);
    String deleteBook(Long id);
}
