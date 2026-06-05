package com.novel.service;

import com.novel.entity.Tip;

import java.util.List;

public interface TipService {
    Tip createTip(Long userId, Long authorId, Long bookId, Long chapterId, Integer amount, String message);
    List<Tip> getBookTips(Long bookId);
    List<Tip> getReceivedTips(Long authorId);
}
