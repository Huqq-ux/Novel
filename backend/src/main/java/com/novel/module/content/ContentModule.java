package com.novel.module.content;

import com.novel.module.AbstractModule;
import org.springframework.stereotype.Component;

@Component
public class ContentModule extends AbstractModule {

    public static final String MODULE_NAME = "content-module";

    public ContentModule() {
        super(MODULE_NAME, "内容管理模块 - 负责书籍和章节的管理");
    }

    @Override
    public void initialize() {
        super.initialize();
        System.out.println("Content module initialized with book and chapter management capabilities");
    }
}
