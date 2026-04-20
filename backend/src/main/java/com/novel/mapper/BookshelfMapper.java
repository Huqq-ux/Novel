package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.Bookshelf;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 书架数据访问接口
 * 
 * 提供书架实体的数据库操作接口，继承MyBatis-Plus的BaseMapper。
 * 书架记录用户收藏的书籍信息。
 * 
 * 设计考量：
 * 1. 继承BaseMapper获得通用CRUD能力
 * 2. 自定义方法处理用户书架查询
 * 3. 使用@Param注解明确参数映射
 * 4. 用户ID和书籍ID联合确定唯一书架记录
 */
public interface BookshelfMapper extends BaseMapper<Bookshelf> {

    /**
     * 查询用户书架列表
     * 
     * 功能描述：
     * 查询指定用户收藏的所有书籍。
     * 
     * 设计考量：
     * - 返回用户所有收藏记录
     * - 按更新时间倒序排列
     * - 用于用户书架页面展示
     * 
     * @param userId 用户ID
     * @return List<Bookshelf> 书架记录列表
     */
    List<Bookshelf> selectByUserId(@Param("userId") Long userId);

    /**
     * 查询用户是否收藏指定书籍
     * 
     * 功能描述：
     * 查询指定用户是否已收藏指定书籍。
     * 
     * 设计考量：
     * - 用于判断书籍是否已收藏
     * - 用户ID和书籍ID联合唯一
     * - 返回null表示未收藏
     * 
     * @param userId 用户ID
     * @param bookId 书籍ID
     * @return Bookshelf 书架记录，不存在返回null
     */
    Bookshelf selectByUserIdAndBookId(@Param("userId") Long userId, @Param("bookId") Long bookId);

    /**
     * 删除书架记录
     * 
     * 功能描述：
     * 从用户书架中移除指定书籍。
     * 
     * 设计考量：
     * - 根据用户ID和书籍ID删除
     * - 返回影响行数，0表示不存在
     * 
     * @param userId 用户ID
     * @param bookId 书籍ID
     * @return int 影响行数
     */
    int deleteByUserIdAndBookId(@Param("userId") Long userId, @Param("bookId") Long bookId);
}
