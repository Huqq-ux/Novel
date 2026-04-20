package com.novel.service.impl;

import com.novel.entity.Book;
import com.novel.entity.Bookshelf;
import com.novel.entity.Chapter;
import com.novel.mapper.BookMapper;
import com.novel.mapper.BookshelfMapper;
import com.novel.mapper.ChapterMapper;
import com.novel.service.BookshelfService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 书架服务实现类
 * 
 * 提供用户书架相关的核心业务逻辑，包括书架管理、阅读进度更新等功能。
 * 书架数据与用户绑定，支持跨设备同步阅读进度。
 * 
 * 设计考量：
 * 1. 书架数据按用户隔离，确保数据安全
 * 2. 使用数据库唯一索引防止重复添加书籍
 * 3. 阅读进度实时计算，支持断点续读
 * 4. 书架列表按最近阅读时间排序
 */
@Service
public class BookshelfServiceImpl implements BookshelfService {

    private static final Logger logger = LoggerFactory.getLogger(BookshelfServiceImpl.class);

    @Autowired
    private BookshelfMapper bookshelfMapper;

    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private ChapterMapper chapterMapper;

    /**
     * 获取用户书架列表
     * 
     * 功能描述：
     * 查询指定用户书架中的所有书籍，包含书籍详细信息和阅读进度。
     * 
     * 实现逻辑：
     * 1. 根据用户ID查询书架记录
     * 2. 关联查询书籍详细信息
     * 3. 按最近阅读时间倒序排列
     * 
     * 设计考量：
     * - 使用LEFT JOIN关联书籍信息，避免N+1查询
     * - 返回完整的书籍信息，便于前端展示
     * - 阅读进度百分比已计算，前端直接使用
     * 
     * @param userId 用户ID
     * @return List<Bookshelf> 书架列表，按最近阅读时间倒序
     */
    @Override
    public List<Bookshelf> getBookshelf(Long userId) {
        return bookshelfMapper.selectByUserId(userId);
    }

    /**
     * 添加书籍到书架
     * 
     * 功能描述：
     * 将指定书籍添加到用户书架中，建立用户与书籍的关联。
     * 
     * 实现逻辑：
     * 1. 检查书籍是否已在书架中
     * 2. 创建书架记录并初始化阅读进度
     * 3. 设置最近阅读时间为当前时间
     * 
     * 设计考量：
     * - 使用数据库唯一索引防止并发重复添加
     * - 捕获DuplicateKeyException处理竞态条件
     * - 初始进度为0，最近阅读时间为当前时间
     * - 重复添加返回false而非抛出异常
     * 
     * @param userId 用户ID
     * @param bookId 书籍ID
     * @return boolean 添加成功返回true，已存在返回false
     */
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

    /**
     * 从书架移除书籍
     * 
     * 功能描述：
     * 从用户书架中移除指定书籍，删除用户与书籍的关联。
     * 
     * 实现逻辑：
     * 1. 根据用户ID和书籍ID删除书架记录
     * 2. 阅读进度数据同步删除
     * 
     * 设计考量：
     * - 移除操作幂等，不存在的记录静默处理
     * - 删除书架记录不影响书籍本身
     * - 不校验书籍是否存在，直接删除关联记录
     * 
     * @param userId 用户ID
     * @param bookId 书籍ID
     */
    @Override
    public void removeFromBookshelf(Long userId, Long bookId) {
        int deleted = bookshelfMapper.deleteByUserIdAndBookId(userId, bookId);
        if (deleted > 0) {
            logger.info("Book removed from bookshelf: userId={}, bookId={}", userId, bookId);
        } else {
            logger.warn("Book not found in bookshelf: userId={}, bookId={}", userId, bookId);
        }
    }

    /**
     * 更新阅读进度
     * 
     * 功能描述：
     * 更新用户在指定书籍中的阅读进度，支持断点续读。
     * 
     * 实现逻辑：
     * 1. 查询书架记录是否存在
     * 2. 不存在则创建新的书架记录
     * 3. 更新当前章节ID和最近阅读时间
     * 4. 计算并更新阅读进度百分比
     * 
     * 设计考量：
     * - 进度更新频率较高，考虑使用异步处理
     * - 章节ID用于断点续读，跳转到上次阅读位置
     * - 最近阅读时间用于书架排序
     * - 进度百分比 = 当前章节序号 / 总章节数 × 100%
     * - 书架不存在时自动创建，简化前端逻辑
     * 
     * @param userId    用户ID
     * @param bookId    书籍ID
     * @param chapterId 当前阅读章节ID
     */
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
