package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.AuditLog;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogMapper extends BaseMapper<AuditLog> {
    List<AuditLog> findByUserId(@Param("userId") Long userId);
    List<AuditLog> findByAction(@Param("action") String action);
    List<AuditLog> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    void deleteOldLogs(@Param("beforeDate") LocalDateTime beforeDate);
}
