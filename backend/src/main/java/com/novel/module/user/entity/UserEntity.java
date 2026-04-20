package com.novel.module.user.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("users")
public class UserEntity {
    
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public LocalDateTime getRegisterTime() { return registerTime; }
    public void setRegisterTime(LocalDateTime registerTime) { this.registerTime = registerTime; }
    public LocalDateTime getLastLoginTime() { return lastLoginTime; }
    public void setLastLoginTime(LocalDateTime lastLoginTime) { this.lastLoginTime = lastLoginTime; }
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Integer getIsAuthor() { return isAuthor; }
    public void setIsAuthor(Integer isAuthor) { this.isAuthor = isAuthor; }
    public Integer getAuthorLevel() { return authorLevel; }
    public void setAuthorLevel(Integer authorLevel) { this.authorLevel = authorLevel; }
    public String getPenName() { return penName; }
    public void setPenName(String penName) { this.penName = penName; }
    public LocalDateTime getAuthorApplyTime() { return authorApplyTime; }
    public void setAuthorApplyTime(LocalDateTime authorApplyTime) { this.authorApplyTime = authorApplyTime; }
    public Integer getCoinBalance() { return coinBalance; }
    public void setCoinBalance(Integer coinBalance) { this.coinBalance = coinBalance; }
}
