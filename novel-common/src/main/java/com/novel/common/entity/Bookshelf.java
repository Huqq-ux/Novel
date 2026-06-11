package com.novel.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("bookshelf")
public class Bookshelf {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("book_id")
    private Long bookId;

    @TableField("last_chapter_id")
    private Long lastChapterId;

    @TableField("last_read_time")
    private LocalDateTime lastReadTime;

    @TableField("read_progress")
    private Integer progress;

    @TableField(exist = false)
    private LocalDateTime addTime;

    @TableField(exist = false)
    private Book book;
}
