package com.novel.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.AuthorApplication;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface AuthorApplicationMapper extends BaseMapper<AuthorApplication> {

    @Select("SELECT * FROM author_applications WHERE user_id = #{userId} ORDER BY create_time DESC LIMIT 1")
    AuthorApplication selectLatestByUserId(Long userId);

    @Select("SELECT * FROM author_applications WHERE status = #{status} ORDER BY create_time DESC")
    List<AuthorApplication> selectByStatus(Integer status);

    @Select("SELECT COUNT(*) FROM author_applications WHERE user_id = #{userId} AND status = 0")
    int countPendingByUserId(Long userId);
}
