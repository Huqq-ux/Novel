package com.novel.service;

import com.novel.entity.Bookshelf;
import java.util.List;

/**
 * 书架服务接口
 */
public interface BookshelfService {
    /**
     * 获取用户的书架
     * @param userId 用户ID
     * @return 书架项列表
     */
    List<Bookshelf> getBookshelf(Long userId);
    
    /**
     * 添加书籍到书架
     * @param userId 用户ID
     * @param bookId 书籍ID
     * @return true表示添加成功，false表示书籍已在书架中
     */
    boolean addToBookshelf(Long userId, Long bookId);
    
    /**
     * 从书架移除书籍
     * @param userId 用户ID
     * @param bookId 书籍ID
     */
    void removeFromBookshelf(Long userId, Long bookId);
    
    /**
     * 更新阅读进度
     * @param userId 用户ID
     * @param bookId 书籍ID
     * @param chapterId 章节ID
     */
    void updateProgress(Long userId, Long bookId, Long chapterId);
}
