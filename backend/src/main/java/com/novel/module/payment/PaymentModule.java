package com.novel.module.payment;

import com.novel.module.AbstractModule;
import org.springframework.stereotype.Component;

@Component
public class PaymentModule extends AbstractModule {

    public static final String MODULE_NAME = "payment-module";

    public PaymentModule() {
        super(MODULE_NAME, "支付管理模块 - 负责书币充值、章节解锁和交易记录");
    }

    @Override
    public void initialize() {
        super.initialize();
        System.out.println("Payment module initialized with recharge and unlock capabilities");
    }
}
