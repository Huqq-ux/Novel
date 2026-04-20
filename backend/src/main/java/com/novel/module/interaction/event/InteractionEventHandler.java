package com.novel.module.interaction.event;

import com.novel.module.event.ModuleEvent;
import com.novel.module.event.ModuleEventBus;
import com.novel.module.event.ModuleEventTypes;
import com.novel.module.interaction.service.InteractionDomainService;
import com.novel.module.spi.ContentServiceFacade;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.Map;

@Component
public class InteractionEventHandler {

    @Autowired
    private ModuleEventBus eventBus;

    @Autowired
    private InteractionDomainService interactionService;

    @Autowired
    private ContentServiceFacade contentService;

    @PostConstruct
    public void init() {
        eventBus.subscribe(ModuleEventTypes.RATING_SUBMITTED, this::handleRatingSubmitted);
    }

    private void handleRatingSubmitted(ModuleEvent event) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) event.getData();
            Long bookId = ((Number) data.get("bookId")).longValue();
            
            Double avgRating = interactionService.getAverageRating(bookId);
            contentService.updateBookRating(bookId, avgRating);
            
            System.out.println("Updated book rating: bookId=" + bookId + ", rating=" + avgRating);
        } catch (Exception e) {
            System.err.println("Error handling rating submitted event: " + e.getMessage());
        }
    }
}
