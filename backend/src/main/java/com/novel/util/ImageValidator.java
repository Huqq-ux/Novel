package com.novel.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Duration;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ImageValidator {

    private static final Logger logger = LoggerFactory.getLogger(ImageValidator.class);

    private static final int CONNECT_TIMEOUT = 5000;
    private static final int READ_TIMEOUT = 10000;

    private static final Set<String> PLACEHOLDER_DOMAINS = new HashSet<>() {{
        add("via.placeholder.com");
        add("placehold.co");
        add("placeholder.com");
        add("via.placeholder.com");
    }};

    private final ConcurrentHashMap<String, Boolean> validationCache = new ConcurrentHashMap<>();

    public boolean isValidImageUrl(String url) {
        if (url == null || url.isEmpty()) {
            return false;
        }

        if (validationCache.containsKey(url)) {
            return validationCache.get(url);
        }

        boolean isValid = doValidate(url);
        validationCache.put(url, isValid);
        return isValid;
    }

    private boolean doValidate(String url) {
        try {
            if (url.startsWith("/uploads/")) {
                return true;
            }

            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                return false;
            }

            URL urlObj = new URL(url);
            
            if (PLACEHOLDER_DOMAINS.contains(urlObj.getHost())) {
                return checkPlaceholderAccessible(url);
            }

            return checkUrlAccessible(url);
        } catch (Exception e) {
            logger.debug("Image validation failed for {}: {}", url, e.getMessage());
            return false;
        }
    }

    private boolean checkUrlAccessible(String url) {
        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
            connection.setRequestMethod("HEAD");
            connection.setConnectTimeout(CONNECT_TIMEOUT);
            connection.setReadTimeout(READ_TIMEOUT);
            connection.setInstanceFollowRedirects(true);

            int responseCode = connection.getResponseCode();
            connection.disconnect();

            return responseCode == HttpURLConnection.HTTP_OK;
        } catch (IOException e) {
            logger.debug("URL not accessible: {}", url);
            return false;
        }
    }

    private boolean checkPlaceholderAccessible(String url) {
        return true;
    }

    public String getDefaultCoverUrl(String title) {
        if (title == null || title.isEmpty()) {
            return "https://placehold.co/200x280/667eea/fff?text=Book";
        }
        
        String encodedTitle = title.replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5]", "");
        String displayText = encodedTitle.length() > 4 
                ? encodedTitle.substring(0, 4) 
                : encodedTitle;
        
        return "https://placehold.co/200x280/667eea/fff?text=" + displayText;
    }

    public String getFallbackCoverUrl(String title, String category) {
        String color = getColorByCategory(category);
        String displayText = title != null && title.length() > 0 
                ? title.substring(0, Math.min(2, title.length()))
                : "书";
        
        return String.format("https://placehold.co/200x280/%s/fff?text=%s", color, displayText);
    }

    private String getColorByCategory(String category) {
        if (category == null) {
            return "667eea";
        }
        
        return switch (category) {
            case "玄幻" -> "6366f1";
            case "仙侠" -> "8b5cf6";
            case "都市" -> "3b82f6";
            case "历史" -> "d97706";
            case "科幻" -> "06b6d4";
            case "游戏" -> "10b981";
            case "悬疑" -> "64748b";
            case "言情" -> "ec4899";
            case "技术" -> "0ea5e9";
            case "文学" -> "f59e0b";
            default -> "667eea";
        };
    }

    public void clearCache() {
        validationCache.clear();
    }

    public void removeFromCache(String url) {
        validationCache.remove(url);
    }
}
