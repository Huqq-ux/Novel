package com.novel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("book_list_items")
public class BookListItem {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("list_id")
    private Long listId;

    @TableField("book_id")
    private Long bookId;

    @TableField("sort_order")
    private Integer sortOrder;

    @TableField("add_time")
    private LocalDateTime addTime;

    @TableField(exist = false)
    private Book book;
}
