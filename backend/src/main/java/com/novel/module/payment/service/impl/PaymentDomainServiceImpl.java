package com.novel.module.payment.service.impl;

import com.novel.module.payment.entity.ChapterUnlockEntity;
import com.novel.module.payment.entity.RechargeRecordEntity;
import com.novel.module.payment.mapper.ChapterUnlockEntityMapper;
import com.novel.module.payment.mapper.RechargeRecordEntityMapper;
import com.novel.module.payment.service.PaymentDomainService;
import com.novel.module.spi.UserServiceFacade;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentDomainServiceImpl implements PaymentDomainService {

    @Autowired
    private RechargeRecordEntityMapper rechargeRecordMapper;

    @Autowired
    private ChapterUnlockEntityMapper chapterUnlockMapper;

    @Autowired
    private UserServiceFacade userServiceFacade;

    @Override
    @Transactional
    public RechargeRecordEntity createRechargeRecord(Long userId, Integer amount, Integer coins, String paymentMethod) {
        RechargeRecordEntity record = new RechargeRecordEntity();
        record.setUserId(userId);
        record.setAmount(amount);
        record.setCoins(coins);
        record.setPaymentMethod(paymentMethod);
        record.setStatus(1);
        record.setTransactionId(UUID.randomUUID().toString());
        record.setCreateTime(LocalDateTime.now());
        rechargeRecordMapper.insert(record);
        
        userServiceFacade.addCoins(userId, coins);
        
        return record;
    }

    @Override
    public List<RechargeRecordEntity> getRechargeRecords(Long userId) {
        return rechargeRecordMapper.findByUserIdOrderByCreateTimeDesc(userId);
    }

    @Override
    @Transactional
    public boolean unlockChapter(Long userId, Long bookId, Long chapterId, Integer price) {
        if (isChapterUnlocked(userId, chapterId)) {
            return true;
        }
        
        if (!userServiceFacade.deductCoins(userId, price)) {
            return false;
        }
        
        ChapterUnlockEntity unlock = new ChapterUnlockEntity();
        unlock.setUserId(userId);
        unlock.setBookId(bookId);
        unlock.setChapterId(chapterId);
        unlock.setCoinsPaid(price);
        unlock.setUnlockTime(LocalDateTime.now());
        chapterUnlockMapper.insert(unlock);
        
        return true;
    }

    @Override
    public boolean isChapterUnlocked(Long userId, Long chapterId) {
        return chapterUnlockMapper.findByUserIdAndChapterId(userId, chapterId).isPresent();
    }

    @Override
    public Optional<ChapterUnlockEntity> getUnlockRecord(Long userId, Long chapterId) {
        return chapterUnlockMapper.findByUserIdAndChapterId(userId, chapterId);
    }

    @Override
    public List<ChapterUnlockEntity> getUnlockedChapters(Long userId, Long bookId) {
        return chapterUnlockMapper.findByUserIdAndBookId(userId, bookId);
    }

    @Override
    public int getUnlockedChapterCount(Long userId) {
        return chapterUnlockMapper.countByUserId(userId);
    }
}
