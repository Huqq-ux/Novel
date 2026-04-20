package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.BookRating;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 书籍评分数据访问接口
 * 
 * 提供书籍评分实体的数据库操作接口，继承MyBatis-Plus的BaseMapper。
 * 管理用户对书籍的评分记录，支持评分统计功能。
 * 
 * 设计考量：
 * 1. 继承BaseMapper获得通用CRUD能力
 * 2. 使用@Select注解直接定义SQL，简化开发
 * 3. 支持平均分、评分分布等统计查询
 * 4. 用户对每本书只能评分一次
 */
@Mapper
public interface BookRatingMapper extends BaseMapper<BookRating> {

    /**
     * 根据书籍ID和用户ID查询评分
     * 
     * 功能描述：
     * 查询指定用户对指定书籍的评分记录。
     * 
     * 设计考量：
     * - 用于判断用户是否已评分
     * - 用于获取用户评分值
     * - 用户对每本书只能评分一次
     * 
     * @param bookId 书籍ID
     * @param userId 用户ID
     * @return BookRating 评分记录，不存在返回null
     */
    @Select("SELECT * FROM book_ratings WHERE book_id = #{bookId} AND user_id = #{userId}")
    BookRating selectByBookIdAndUserId(@Param("bookId") Long bookId, @Param("userId") Long userId);

    /**
     * 根据书籍ID查询所有评分
     * 
     * 功能描述：
     * 查询指定书籍的所有评分记录。
     * 
     * 设计考量：
     * - 用于评分列表展示
     * - 可配合分页使用
     * 
     * @param bookId 书籍ID
     * @return List<BookRating> 评分记录列表
     */
    @Select("SELECT * FROM book_ratings WHERE book_id = #{bookId}")
    List<BookRating> selectByBookId(@Param("bookId") Long bookId);

    /**
     * 统计书籍的平均评分
     * 
     * 功能描述：
     * 计算指定书籍的平均评分。
     * 
     * 设计考量：
     * - 使用AVG函数直接计算
     * - 无评分时返回null
     * - 用于书籍列表和详情展示
     * 
     * @param bookId 书籍ID
     * @return Double 平均评分，无评分返回null
     */
    @Select("SELECT AVG(rating) FROM book_ratings WHERE book_id = #{bookId}")
    Double selectAvgRatingByBookId(@Param("bookId") Long bookId);

    /**
     * 统计书籍的评分总数
     * 
     * 功能描述：
     * 统计指定书籍的评分人数。
     * 
     * 设计考量：
     * - 使用COUNT函数统计
     * - 用于显示评分人数
     * 
     * @param bookId 书籍ID
     * @return Integer 评分总数
     */
    @Select("SELECT COUNT(*) FROM book_ratings WHERE book_id = #{bookId}")
    Integer selectCountByBookId(@Param("bookId") Long bookId);

    /**
     * 统计书籍各星级评分数量
     * 
     * 功能描述：
     * 统计指定书籍各星级的评分数量分布。
     * 
     * 实现逻辑：
     * 1. 按评分值分组统计
     * 2. 按评分值降序排列
     * 
     * 设计考量：
     * - 用于评分分布图表展示
     * - 返回Map列表，包含rating和count字段
     * - 按星级降序便于展示
     * 
     * @param bookId 书籍ID
     * @return List<Map<String, Object>> 各星级评分数量列表
     */
    @Select("SELECT rating, COUNT(*) as count FROM book_ratings WHERE book_id = #{bookId} GROUP BY rating ORDER BY rating DESC")
    List<Map<String, Object>> selectRatingDistributionByBookId(@Param("bookId") Long bookId);
}
