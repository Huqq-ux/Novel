package com.novel.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("author_audit_records")
public class AuthorAuditRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long applicationId;
    private Long auditorId;
    private Integer action;
    private String comment;
    private LocalDateTime createTime;

    public static final int ACTION_APPROVE = 1;
    public static final int ACTION_REJECT = 2;
}
