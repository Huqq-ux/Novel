package com.novel.module.reading;

import com.novel.module.AbstractModule;
import org.springframework.stereotype.Component;

@Component
public class ReadingModule extends AbstractModule {

    public static final String MODULE_NAME = "reading-module";

    public ReadingModule() {
        super(MODULE_NAME, "阅读管理模块 - 负责书架、阅读进度和阅读历史管理");
    }

    @Override
    public void initialize() {
        super.initialize();
        System.out.println("Reading module initialized with bookshelf and reading history capabilities");
    }
}
