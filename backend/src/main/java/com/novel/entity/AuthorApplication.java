package com.novel.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("author_applications")
public class AuthorApplication {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String realName;
    private String phone;
    private String email;
    private String penName;
    private String specialty;
    private String workSamples;
    private String introduction;
    private String idCard;
    private Integer status;
    private String verifyCode;
    private LocalDateTime verifyExpired;
    private Integer verified;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    public static final int STATUS_DRAFT = -1;
    public static final int STATUS_PENDING = 0;
    public static final int STATUS_APPROVED = 1;
    public static final int STATUS_REJECTED = 2;
}
