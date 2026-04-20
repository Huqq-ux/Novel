package com.novel.service.impl;

import com.novel.dto.SignInStatusDTO;
import com.novel.entity.SignInRecord;
import com.novel.entity.User;
import com.novel.mapper.SignInMapper;
import com.novel.mapper.UserMapper;
import com.novel.service.SignInService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 签到服务实现类
 * 
 * 提供用户每日签到相关的核心业务逻辑，包括签到状态查询、签到执行和奖励发放。
 * 采用连续签到奖励递增机制，鼓励用户每日活跃。
 * 
 * 设计考量：
 * 1. 签到记录使用数据库唯一索引防止重复签到
 * 2. 连续签到奖励按7天周期循环，中断后重新计算
 * 3. 书币奖励实时到账，同步更新用户余额
 * 4. 使用事务确保签到记录和余额更新的原子性
 */
@Service
public class SignInServiceImpl implements SignInService {

    private static final Logger logger = LoggerFactory.getLogger(SignInServiceImpl.class);

    @Autowired
    private SignInMapper signInMapper;

    @Autowired
    private UserMapper userMapper;

    /**
     * 获取用户签到状态
     * 
     * 功能描述：
     * 查询用户的签到状态，包括今日是否已签到、连续签到天数、累计签到天数和奖励信息。
     * 
     * 实现逻辑：
     * 1. 查询今日签到记录，判断是否已签到
     * 2. 查询最近一次签到记录，计算连续签到天数
     * 3. 统计累计签到天数
     * 4. 计算下次签到可获得的奖励
     * 5. 构建签到奖励列表（7天周期）
     * 
     * 设计考量：
     * - 连续签到判断：最近签到日期为今天或昨天才算连续
     * - 奖励按7天周期循环，第8天重置为第1天奖励
     * - 返回完整的签到信息，减少前端多次请求
     * - 奖励列表用于前端展示签到日历
     * 
     * @param userId 用户ID
     * @return SignInStatusDTO 签到状态信息
     */
    @Override
    public SignInStatusDTO getSignInStatus(Long userId) {
        LocalDate today = LocalDate.now();
        
        SignInRecord todayRecord = signInMapper.selectByUserIdAndDate(userId, today);
        boolean todaySigned = todayRecord != null;
        
        SignInRecord latestRecord = signInMapper.selectLatestByUserId(userId);
        int continuousDays = 0;
        
        if (latestRecord != null) {
            LocalDate lastSignDate = latestRecord.getSignDate();
            LocalDate yesterday = today.minusDays(1);
            
            if (lastSignDate.equals(today)) {
                continuousDays = latestRecord.getContinuousDays();
            } else if (lastSignDate.equals(yesterday)) {
                continuousDays = latestRecord.getContinuousDays();
            } else {
                continuousDays = 0;
            }
        }
        
        int totalDays = signInMapper.countByUserId(userId);
        
        int todayReward = calculateReward(continuousDays + 1);
        
        List<SignInStatusDTO.RewardInfo> rewards = new ArrayList<>();
        for (int i = 1; i <= 7; i++) {
            int reward = calculateReward(i);
            boolean signed = i <= continuousDays;
            
            rewards.add(new SignInStatusDTO.RewardInfo(i, reward, signed));
        }
        
        return new SignInStatusDTO(todaySigned, continuousDays, totalDays, todayReward, rewards);
    }

    /**
     * 执行用户签到
     * 
     * 功能描述：
     * 为用户执行每日签到操作，发放签到奖励。
     * 
     * 实现逻辑：
     * 1. 检查今日是否已签到（双重校验）
     * 2. 计算连续签到天数
     * 3. 计算签到奖励
     * 4. 创建签到记录
     * 5. 发放书币奖励到用户账户
     * 
     * 设计考量：
     * - 使用数据库唯一索引防止并发重复签到
     * - 捕获DuplicateKeyException处理竞态条件
     * - 使用@Transactional确保签到记录和余额更新的原子性
     * - 连续签到天数从最近一次签到日期计算
     * - 签到失败返回false而非抛出异常，便于Controller处理
     * 
     * @param userId 用户ID
     * @return boolean 签到成功返回true，已签到返回false
     */
    @Override
    @Transactional
    public boolean signIn(Long userId) {
        LocalDate today = LocalDate.now();
        
        SignInRecord existing = signInMapper.selectByUserIdAndDate(userId, today);
        if (existing != null) {
            logger.info("User already signed in today (checked before insert): userId={}", userId);
            return false;
        }
        
        SignInRecord latestRecord = signInMapper.selectLatestByUserId(userId);
        int continuousDays = 1;
        
        if (latestRecord != null) {
            LocalDate lastSignDate = latestRecord.getSignDate();
            LocalDate yesterday = today.minusDays(1);
            
            if (lastSignDate.equals(yesterday)) {
                continuousDays = latestRecord.getContinuousDays() + 1;
            }
        }
        
        int reward = calculateReward(continuousDays);
        
        SignInRecord record = new SignInRecord();
        record.setUserId(userId);
        record.setSignDate(today);
        record.setContinuousDays(continuousDays);
        record.setReward(reward);
        record.setCreateTime(LocalDateTime.now());
        
        try {
            signInMapper.insert(record);
            
            User user = userMapper.selectById(userId);
            if (user != null) {
                int currentBalance = user.getCoinBalance() != null ? user.getCoinBalance() : 0;
                user.setCoinBalance(currentBalance + reward);
                userMapper.updateById(user);
                logger.info("Updated user coin balance: userId={}, oldBalance={}, newBalance={}", 
                    userId, currentBalance, user.getCoinBalance());
            }
            
            logger.info("User signed in successfully: userId={}, continuousDays={}, reward={}", userId, continuousDays, reward);
            return true;
        } catch (DuplicateKeyException e) {
            logger.warn("Duplicate sign in detected (race condition): userId={}, date={}", userId, today);
            return false;
        } catch (Exception e) {
            logger.error("Failed to sign in: userId={}, error={}", userId, e.getMessage());
            throw e;
        }
    }
    
    /**
     * 计算签到奖励
     * 
     * 功能描述：
     * 根据连续签到天数计算应发放的书币奖励。
     * 
     * 实现逻辑：
     * 1. 将连续天数映射到7天周期内
     * 2. 奖励 = 周期内天数 × 10
     * 
     * 设计考量：
     * - 奖励按7天周期循环，第8天重置为第1天
     * - 第1天10书币，第7天70书币
     * - 奖励递增激励用户连续签到
     * 
     * @param continuousDays 连续签到天数
     * @return int 书币奖励数量
     */
    private int calculateReward(int continuousDays) {
        int dayInCycle = ((continuousDays - 1) % 7) + 1;
        return dayInCycle * 10;
    }
}
