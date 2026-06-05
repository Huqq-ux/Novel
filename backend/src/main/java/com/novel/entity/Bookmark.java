package com.novel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("bookmarks")
public class Bookmark {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("book_id")
    private Long bookId;

    @TableField("chapter_id")
    private Long chapterId;

    @TableField("chapter_title")
    private String chapterTitle;

    @TableField("position")
    private Integer position;

    @TableField("note")
    private String note;

    @TableField("create_time")
    private LocalDateTime createTime;
}
