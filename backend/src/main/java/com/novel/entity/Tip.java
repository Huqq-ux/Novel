package com.novel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("tips")
public class Tip {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("author_id")
    private Long authorId;

    @TableField("book_id")
    private Long bookId;

    @TableField("chapter_id")
    private Long chapterId;

    @TableField("amount")
    private Integer amount;

    @TableField("message")
    private String message;

    @TableField("create_time")
    private LocalDateTime createTime;
}
