package com.novel.module.user;

import com.novel.module.AbstractModule;
import org.springframework.stereotype.Component;

@Component
public class UserModule extends AbstractModule {

    public static final String MODULE_NAME = "user-module";

    public UserModule() {
        super(MODULE_NAME, "用户管理模块 - 负责用户注册、登录、信息管理和作者认证");
    }

    @Override
    public void initialize() {
        super.initialize();
        System.out.println("User module initialized with user management and authentication capabilities");
    }
}
