package com.novel.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.novel.entity.Book;
import com.novel.entity.Chapter;
import com.novel.entity.User;
import com.novel.mapper.BookMapper;
import com.novel.mapper.ChapterMapper;
import com.novel.mapper.CommentMapper;
import com.novel.mapper.UserMapper;
import com.novel.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private ChapterMapper chapterMapper;

    @Autowired
    private CommentMapper commentMapper;

    @Override
    public Page<User> getUsers(int page, int pageSize, String keyword, String role, Integer status) {
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            queryWrapper.and(w -> w.like("username", keyword).or().like("email", keyword));
        }
        if (role != null && !role.isEmpty()) {
            queryWrapper.eq("role", role);
        }
        if (status != null) {
            queryWrapper.eq("status", status);
        }
        queryWrapper.orderByDesc("register_time");
        return userMapper.selectPage(new Page<>(page, pageSize), queryWrapper);
    }

    @Override
    public String updateUserStatus(Long id, Integer status) {
        if (status == null || (status != 0 && status != 1)) {
            throw new IllegalArgumentException("无效的状态值");
        }
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        user.setStatus(status);
        int updated = userMapper.updateById(user);
        if (updated > 0) {
            return status == 1 ? "用户已启用" : "用户已禁用";
        }
        throw new RuntimeException("操作失败");
    }

    @Override
    public String updateUserRole(Long id, String role) {
        if (role == null || (!role.equals("user") && !role.equals("admin"))) {
            throw new IllegalArgumentException("无效的角色");
        }
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        user.setRole(role);
        int updated = userMapper.updateById(user);
        if (updated > 0) {
            return "角色已更新";
        }
        throw new RuntimeException("操作失败");
    }

    @Override
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userMapper.selectCount(null));
        QueryWrapper<User> authorQuery = new QueryWrapper<>();
        authorQuery.eq("is_author", 1);
        stats.put("totalAuthors", userMapper.selectCount(authorQuery));
        QueryWrapper<User> activeQuery = new QueryWrapper<>();
        activeQuery.eq("status", 1);
        stats.put("activeUsers", userMapper.selectCount(activeQuery));
        stats.put("totalBooks", bookMapper.selectCount(null));
        stats.put("totalChapters", chapterMapper.selectCount(null));
        stats.put("totalComments", commentMapper.selectCount(null));
        stats.put("totalWords", 0);
        stats.put("totalReads", 0);
        return stats;
    }

    @Override
    public Page<Book> getBooks(int page, int pageSize, String keyword, String category, Integer status, Integer priceType) {
        QueryWrapper<Book> queryWrapper = new QueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            queryWrapper.and(w -> w.like("title", keyword).or().like("author", keyword));
        }
        if (category != null && !category.isEmpty()) {
            queryWrapper.eq("category", category);
        }
        if (status != null) {
            queryWrapper.eq("status", status);
        }
        if (priceType != null) {
            queryWrapper.eq("price_type", priceType);
        }
        queryWrapper.orderByDesc("create_time");
        return bookMapper.selectPage(new Page<>(page, pageSize), queryWrapper);
    }

    @Override
    public Map<String, Object> addPaidBook(Map<String, Object> body) {
        Book book = new Book();
        book.setTitle((String) body.get("title"));
        book.setAuthor((String) body.get("author"));
        book.setCategory((String) body.get("category"));
        book.setDescription((String) body.get("description"));
        book.setCover((String) body.get("cover"));
        book.setPriceType(1);
        book.setFreeChapterCount(body.get("freeChapterCount") != null ? (Integer) body.get("freeChapterCount") : 5);
        book.setTotalWords(body.get("totalWords") != null ? (Integer) body.get("totalWords") : 0);
        book.setStatus(body.get("status") != null ? (Integer) body.get("status") : 1);
        book.setChapterCount(0);
        book.setClickCount(0);
        book.setCollectCount(0);
        book.setCreateTime(LocalDateTime.now());
        book.setUpdateTime(LocalDateTime.now());
        int inserted = bookMapper.insert(book);
        if (inserted > 0) {
            Map<String, Object> result = new HashMap<>();
            result.put("id", book.getId());
            result.put("title", book.getTitle());
            return result;
        }
        throw new RuntimeException("添加失败");
    }

    @Override
    public String updatePaidBook(Long id, Map<String, Object> body) {
        Book book = bookMapper.selectById(id);
        if (book == null) {
            throw new IllegalArgumentException("书籍不存在");
        }
        if (body.get("title") != null) book.setTitle((String) body.get("title"));
        if (body.get("author") != null) book.setAuthor((String) body.get("author"));
        if (body.get("category") != null) book.setCategory((String) body.get("category"));
        if (body.get("description") != null) book.setDescription((String) body.get("description"));
        if (body.get("cover") != null) book.setCover((String) body.get("cover"));
        if (body.get("freeChapterCount") != null) book.setFreeChapterCount((Integer) body.get("freeChapterCount"));
        if (body.get("totalWords") != null) book.setTotalWords((Integer) body.get("totalWords"));
        book.setUpdateTime(LocalDateTime.now());
        int updated = bookMapper.updateById(book);
        if (updated > 0) {
            return "更新成功";
        }
        throw new RuntimeException("更新失败");
    }

    @Override
    public String updateBookStatus(Long id, Integer status) {
        if (status == null || (status != 0 && status != 1)) {
            throw new IllegalArgumentException("无效的状态值");
        }
        Book book = bookMapper.selectById(id);
        if (book == null) {
            throw new IllegalArgumentException("书籍不存在");
        }
        book.setStatus(status);
        book.setUpdateTime(LocalDateTime.now());
        int updated = bookMapper.updateById(book);
        if (updated > 0) {
            return status == 1 ? "书籍已上架" : "书籍已下架";
        }
        throw new RuntimeException("操作失败");
    }

    @Override
    public String deleteBook(Long id) {
        Book book = bookMapper.selectById(id);
        if (book == null) {
            throw new IllegalArgumentException("书籍不存在");
        }
        int deleted = bookMapper.deleteById(id);
        if (deleted > 0) {
            return "书籍已删除";
        }
        throw new RuntimeException("删除失败");
    }
}
