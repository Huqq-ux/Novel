package com.novel.module.interaction;

import com.novel.module.AbstractModule;
import org.springframework.stereotype.Component;

@Component
public class InteractionModule extends AbstractModule {

    public static final String MODULE_NAME = "interaction-module";

    public InteractionModule() {
        super(MODULE_NAME, "互动管理模块 - 负责评论、评分和点赞功能");
    }

    @Override
    public void initialize() {
        super.initialize();
        System.out.println("Interaction module initialized with comment, rating and like capabilities");
    }
}
