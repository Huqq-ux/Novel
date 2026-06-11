package com.novel.user.controller;

import com.novel.common.dto.ApiResponse;
import com.novel.common.dto.UserDTO;
import com.novel.common.entity.User;
import com.novel.common.security.CurrentUser;
import com.novel.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/info")
    public ApiResponse<UserDTO> getUserInfo(@CurrentUser Long userId) {
        if (userId == null) {
            return ApiResponse.error(401, "用户未认证");
        }

        User user = userService.getUserById(userId);
        if (user == null) {
            return ApiResponse.error(404, "用户不存在");
        }

        UserDTO userDTO = new UserDTO(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getAvatar(),
            user.getGender(),
            user.getAge(),
            user.getRegisterTime(),
            user.getLastLoginTime(),
            user.getStatus(),
            user.getRole() != null ? user.getRole() : "user",
            user.getIsAuthor() != null ? user.getIsAuthor() : 0,
            user.getPenName(),
            user.getCoinBalance() != null ? user.getCoinBalance() : 0
        );
        return ApiResponse.success(userDTO);
    }
}
