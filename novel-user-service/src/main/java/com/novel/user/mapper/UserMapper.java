package com.novel.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.User;
import org.apache.ibatis.annotations.Param;

public interface UserMapper extends BaseMapper<User> {

    User selectByUsername(@Param("username") String username);

    boolean existsByUsername(@Param("username") String username);

    boolean existsByEmail(@Param("email") String email);
}
