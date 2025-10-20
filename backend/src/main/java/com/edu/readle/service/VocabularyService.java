package com.edu.readle.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VocabularyService {

    private static final Logger logger = LoggerFactory.getLogger(VocabularyService.class);
    private static final String DICTIONARY_API_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
    private static final int MAX_WORD_LENGTH = 50;

    // Simple in-memory cache to reduce API calls
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    /**
     * Fetch word definition from Dictionary API
     * 
     * @param word The word to look up
     * @return ResponseEntity with definition or error
     */
    public ResponseEntity<?> getWordDefinition(String word) {
        // Validate input
        if (word == null || word.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Word cannot be empty"));
        }

        // Clean and validate word
        String cleanWord = word.toLowerCase().trim();

        if (!cleanWord.matches("^[a-zA-Z]+$")) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Word can only contain letters"));
        }

        if (cleanWord.length() > MAX_WORD_LENGTH) {
            return ResponseEntity.badRequest()
                    .body(createErrorResponse("Word is too long"));
        }

        // Check cache first
        if (cache.containsKey(cleanWord)) {
            logger.info("Returning cached definition for word: {}", cleanWord);
            return ResponseEntity.ok(cache.get(cleanWord));
        }

        // Fetch from Dictionary API
        try {
            // Create RestTemplate instance directly (like ImagenService does)
            RestTemplate restTemplate = new RestTemplate();

            String url = DICTIONARY_API_BASE_URL + cleanWord;
            logger.info("Fetching definition for word: {} from {}", cleanWord, url);

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            String definition = response.getBody();

            // Cache the result
            if (definition != null) {
                cache.put(cleanWord, definition);
            }

            logger.info("Successfully fetched definition for word: {}", cleanWord);
            return ResponseEntity.ok(definition);

        } catch (HttpClientErrorException.NotFound e) {
            logger.warn("Word not found in dictionary: {}", cleanWord);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Word not found in dictionary"));

        } catch (Exception e) {
            logger.error("Error fetching definition for word: {}", cleanWord, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch word definition"));
        }
    }

    /**
     * Clear the cache (useful for maintenance)
     */
    public void clearCache() {
        cache.clear();
        logger.info("Vocabulary cache cleared");
    }

    /**
     * Get cache statistics
     */
    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("cachedWords", cache.size());
        return stats;
    }

    /**
     * Create a standardized error response
     */
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}
