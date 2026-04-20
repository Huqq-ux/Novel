package com.novel.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.entity.SignInRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDate;
import java.util.List;

/**
 * 签到记录数据访问接口
 * 
 * 提供签到记录实体的数据库操作接口，继承MyBatis-Plus的BaseMapper。
 * 记录用户每日签到信息，支持连续签到统计。
 * 
 * 设计考量：
 * 1. 继承BaseMapper获得通用CRUD能力
 * 2. 使用@Select注解直接定义SQL，简化开发
 * 3. 签到日期和用户ID联合唯一
 * 4. 支持签到统计和连续签到判断
 */
@Mapper
public interface SignInMapper extends BaseMapper<SignInRecord> {

    /**
     * 查询用户指定日期的签到记录
     * 
     * 功能描述：
     * 查询用户在指定日期是否已签到。
     * 
     * 设计考量：
     * - 用于判断用户今日是否已签到
     * - 用户ID和签到日期联合唯一
     * - 返回null表示未签到
     * 
     * @param userId   用户ID
     * @param signDate 签到日期
     * @return SignInRecord 签到记录，不存在返回null
     */
    @Select("SELECT * FROM sign_in_records WHERE user_id = #{userId} AND sign_date = #{signDate}")
    SignInRecord selectByUserIdAndDate(Long userId, LocalDate signDate);

    /**
     * 查询用户最近一次签到记录
     * 
     * 功能描述：
     * 查询用户最近一次的签到记录，按日期倒序取第一条。
     * 
     * 设计考量：
     * - 用于判断连续签到天数
     * - 如果最近签到日期是昨天，则连续签到
     * - 如果最近签到日期不是昨天，则连续签到中断
     * 
     * @param userId 用户ID
     * @return SignInRecord 最近签到记录，无记录返回null
     */
    @Select("SELECT * FROM sign_in_records WHERE user_id = #{userId} ORDER BY sign_date DESC LIMIT 1")
    SignInRecord selectLatestByUserId(Long userId);

    /**
     * 统计用户签到总次数
     * 
     * 功能描述：
     * 统计用户的累计签到次数。
     * 
     * 设计考量：
     * - 用于用户等级或成就系统
     * - 使用COUNT函数提高性能
     * 
     * @param userId 用户ID
     * @return int 签到总次数
     */
    @Select("SELECT COUNT(*) FROM sign_in_records WHERE user_id = #{userId}")
    int countByUserId(Long userId);

    /**
     * 查询用户所有签到记录
     * 
     * 功能描述：
     * 查询用户的所有签到记录，按日期倒序排列。
     * 
     * 设计考量：
     * - 用于签到日历展示
     * - 按日期倒序便于最近记录优先展示
     * 
     * @param userId 用户ID
     * @return List<SignInRecord> 签到记录列表
     */
    @Select("SELECT * FROM sign_in_records WHERE user_id = #{userId} ORDER BY sign_date DESC")
    List<SignInRecord> selectAllByUserId(Long userId);
}
