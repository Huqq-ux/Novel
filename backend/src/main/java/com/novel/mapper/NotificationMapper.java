package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.Notification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {
    
    @Select("SELECT * FROM notifications WHERE user_id = #{userId} ORDER BY create_time DESC LIMIT #{limit} OFFSET #{offset}")
    List<Notification> selectByUserId(@Param("userId") Long userId, @Param("limit") int limit, @Param("offset") int offset);
    
    @Select("SELECT COUNT(*) FROM notifications WHERE user_id = #{userId} AND is_read = 0")
    int countUnreadByUserId(Long userId);
    
    @Update("UPDATE notifications SET is_read = 1 WHERE user_id = #{userId} AND is_read = 0")
    int markAllAsRead(Long userId);
}
