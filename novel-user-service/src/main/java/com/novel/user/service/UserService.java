package com.novel.user.service;

import com.novel.common.entity.User;

public interface UserService {
    User login(String username, String password);

    User register(String username, String password, String email);

    User getUserById(Long id);

    User getUserByUsername(String username);
}
