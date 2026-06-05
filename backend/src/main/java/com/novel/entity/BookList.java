package com.novel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("book_lists")
public class BookList {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("title")
    private String title;

    @TableField("description")
    private String description;

    @TableField("cover")
    private String cover;

    @TableField("is_public")
    private Integer isPublic;

    @TableField("like_count")
    private Integer likeCount;

    @TableField("book_count")
    private Integer bookCount;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;
}
