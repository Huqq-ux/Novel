package com.novel.module.payment.service;

import com.novel.module.payment.entity.ChapterUnlockEntity;
import com.novel.module.payment.entity.RechargeRecordEntity;

import java.util.List;
import java.util.Optional;

public interface PaymentDomainService {

    RechargeRecordEntity createRechargeRecord(Long userId, Integer amount, Integer coins, String paymentMethod);
    
    List<RechargeRecordEntity> getRechargeRecords(Long userId);
    
    boolean unlockChapter(Long userId, Long bookId, Long chapterId, Integer price);
    
    boolean isChapterUnlocked(Long userId, Long chapterId);
    
    Optional<ChapterUnlockEntity> getUnlockRecord(Long userId, Long chapterId);
    
    List<ChapterUnlockEntity> getUnlockedChapters(Long userId, Long bookId);
    
    int getUnlockedChapterCount(Long userId);
}
