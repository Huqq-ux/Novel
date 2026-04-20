package com.novel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 书籍评分实体类
 */
@Data
@TableName("book_ratings")
public class BookRating {
    /**
     * 评分ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 书籍ID
     */
    private Long bookId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 评分(1-5星)
     */
    private Integer rating;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}
