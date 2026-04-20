package com.novel.module.spi;

import java.util.Optional;

public interface UserServiceFacade {

    boolean existsById(Long userId);
    
    Optional<UserInfo> getUserInfo(Long userId);
    
    Optional<UserInfo> getUserByUsername(String username);
    
    boolean deductCoins(Long userId, Integer amount);
    
    boolean addCoins(Long userId, Integer amount);
    
    Integer getCoinBalance(Long userId);
    
    boolean isAuthor(Long userId);

    class UserInfo {
        private Long id;
        private String username;
        private String email;
        private String avatar;
        private String role;
        private Integer coinBalance;
        private Integer isAuthor;
        private String penName;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getAvatar() { return avatar; }
        public void setAvatar(String avatar) { this.avatar = avatar; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public Integer getCoinBalance() { return coinBalance; }
        public void setCoinBalance(Integer coinBalance) { this.coinBalance = coinBalance; }
        public Integer getIsAuthor() { return isAuthor; }
        public void setIsAuthor(Integer isAuthor) { this.isAuthor = isAuthor; }
        public String getPenName() { return penName; }
        public void setPenName(String penName) { this.penName = penName; }
    }
}
