package com.novel.payment.service.impl;

import com.novel.common.dto.SignInStatusDTO;
import com.novel.common.entity.SignInRecord;
import com.novel.common.entity.User;
import com.novel.payment.mapper.SignInMapper;
import com.novel.payment.mapper.UserMapper;
import com.novel.payment.service.SignInService;
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

@Service
public class SignInServiceImpl implements SignInService {

    private static final Logger logger = LoggerFactory.getLogger(SignInServiceImpl.class);

    @Autowired
    private SignInMapper signInMapper;

    @Autowired
    private UserMapper userMapper;

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

    private int calculateReward(int continuousDays) {
        int dayInCycle = ((continuousDays - 1) % 7) + 1;
        return dayInCycle * 10;
    }
}
