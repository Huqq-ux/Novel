package com.novel.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 章节实体类
 */
@Data
@TableName("chapters")
public class Chapter {
    /**
     * 章节ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 书籍ID
     */
    private Long bookId;

    /**
     * 章节标题
     */
    private String title;

    /**
     * 章节内容
     */
    private String content;

    /**
     * 章节序号
     */
    private Integer orderNum;

    /**
     * 字数
     */
    private Integer wordCount;

    /**
     * 章节价格(书币)
     */
    private Integer price;

    /**
     * 是否免费 (0:付费, 1:免费)
     */
    private Integer isFree;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}
