package com.novel.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String username;
    private String password;
    private String email;
    private String avatar;
    private String gender;
    private Integer age;
    private LocalDateTime registerTime;
    private LocalDateTime lastLoginTime;
    private Integer status;
    private String role;
    private Integer isAuthor;
    private Integer authorLevel;
    private String penName;
    private LocalDateTime authorApplyTime;
    private Integer coinBalance;
}
