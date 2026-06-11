package com.novel.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 书籍实体类
 */
@Data
@TableName("books")
public class Book {
    /**
     * 书籍ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 书名
     */
    private String title;

    /**
     * 作者
     */
    private String author;

    /**
     * 封面图片
     */
    private String cover;

    /**
     * 分类
     */
    private String category;

    /**
     * 简介
     */
    private String description;

    /**
     * 总章节数
     */
    private Integer chapterCount;

    /**
     * 是否完结
     */
    private Boolean isFinished;

    /**
     * 评分
     */
    private Double rating;

    /**
     * 点击量
     */
    private Integer clickCount;

    /**
     * 收藏数
     */
    private Integer collectCount;

    /**
     * 状态 (0:下架, 1:上架)
     */
    private Integer status;

    /**
     * 付费类型 (0:免费, 1:付费)
     */
    private Integer priceType;

    /**
     * 作者用户ID
     */
    private Long authorId;

    /**
     * 免费章节数
     */
    private Integer freeChapterCount;

    /**
     * 总字数
     */
    private Integer totalWords;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;

    /**
     * 最新章节名称
     */
    private String latestChapterName;

    /**
     * 最新章节更新时间
     */
    private LocalDateTime latestChapterUpdateTime;
}
