package com.novel.service.impl;

import com.novel.entity.CoinRechargeRecord;
import com.novel.entity.Tip;
import com.novel.entity.User;
import com.novel.mapper.CoinRechargeRecordMapper;
import com.novel.mapper.TipMapper;
import com.novel.mapper.UserMapper;
import com.novel.service.TipService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
public class TipServiceImpl implements TipService {

    private static final Logger logger = LoggerFactory.getLogger(TipServiceImpl.class);

    @Autowired
    private TipMapper tipMapper;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private CoinRechargeRecordMapper coinRechargeRecordMapper;

    @Override
    @Transactional
    public Tip createTip(Long userId, Long authorId, Long bookId, Long chapterId, Integer amount, String message) {
        User tipper = userMapper.selectById(userId);
        if (tipper == null) throw new RuntimeException("用户不存在");
        if (tipper.getCoinBalance() < amount) throw new RuntimeException("书币余额不足");

        User author = userMapper.selectById(authorId);
        if (author == null) throw new RuntimeException("作者不存在");

        tipper.setCoinBalance(tipper.getCoinBalance() - amount);
        userMapper.updateById(tipper);

        author.setCoinBalance(author.getCoinBalance() + amount);
        userMapper.updateById(author);

        Tip tip = new Tip();
        tip.setUserId(userId);
        tip.setAuthorId(authorId);
        tip.setBookId(bookId);
        tip.setChapterId(chapterId);
        tip.setAmount(amount);
        tip.setMessage(message != null ? message : "");
        tip.setCreateTime(LocalDateTime.now());
        tipMapper.insert(tip);

        CoinRechargeRecord tipperRecord = new CoinRechargeRecord();
        tipperRecord.setUserId(userId);
        tipperRecord.setAmount(-amount);
        tipperRecord.setPaymentMethod("tip_out");
        tipperRecord.setTransactionId("TIP_OUT_" + tip.getId());
        tipperRecord.setStatus(1);
        tipperRecord.setCreateTime(LocalDateTime.now());
        coinRechargeRecordMapper.insert(tipperRecord);

        CoinRechargeRecord authorRecord = new CoinRechargeRecord();
        authorRecord.setUserId(authorId);
        authorRecord.setAmount(amount);
        authorRecord.setPaymentMethod("tip_in");
        authorRecord.setTransactionId("TIP_IN_" + tip.getId());
        authorRecord.setStatus(1);
        authorRecord.setCreateTime(LocalDateTime.now());
        coinRechargeRecordMapper.insert(authorRecord);

        logger.info("Tip created: id={}, from={}, to={}, amount={}", tip.getId(), userId, authorId, amount);
        return tip;
    }

    @Override
    public List<Tip> getBookTips(Long bookId) {
        List<Tip> list = tipMapper.selectByBookId(bookId);
        return list != null ? list : Collections.emptyList();
    }

    @Override
    public List<Tip> getReceivedTips(Long authorId) {
        List<Tip> list = tipMapper.selectByAuthorId(authorId);
        return list != null ? list : Collections.emptyList();
    }
}
