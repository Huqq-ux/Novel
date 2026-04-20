package com.novel.module.config;

import com.novel.module.ModuleContext;
import com.novel.module.content.ContentModule;
import com.novel.module.interaction.InteractionModule;
import com.novel.module.payment.PaymentModule;
import com.novel.module.reading.ReadingModule;
import com.novel.module.user.UserModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

@Component
public class ModuleInitializer implements ApplicationListener<ApplicationReadyEvent> {

    @Autowired
    private ModuleContext moduleContext;

    @Autowired
    private UserModule userModule;

    @Autowired
    private ContentModule contentModule;

    @Autowired
    private ReadingModule readingModule;

    @Autowired
    private InteractionModule interactionModule;

    @Autowired
    private PaymentModule paymentModule;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        System.out.println("========================================");
        System.out.println("Initializing Modular Architecture...");
        System.out.println("========================================");
        
        userModule.initialize();
        contentModule.initialize();
        readingModule.initialize();
        interactionModule.initialize();
        paymentModule.initialize();
        
        System.out.println("========================================");
        System.out.println("All modules initialized successfully!");
        System.out.println("Total modules: " + moduleContext.getAllModules().size());
        System.out.println("========================================");
    }
}
