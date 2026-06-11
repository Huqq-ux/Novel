package com.novel.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.AuthorAuditRecord;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface AuthorAuditRecordMapper extends BaseMapper<AuthorAuditRecord> {

    @Select("SELECT * FROM author_audit_records WHERE application_id = #{applicationId} ORDER BY create_time DESC")
    List<AuthorAuditRecord> selectByApplicationId(Long applicationId);
}
