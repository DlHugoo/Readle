package com.edu.readle.controller;

import com.edu.readle.service.VocabularyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = { "http://localhost:5173", "https://readle-pi.vercel.app" })
@RequestMapping("/api/vocabulary")
public class VocabularyController {

    private static final Logger logger = LoggerFactory.getLogger(VocabularyController.class);

    @Autowired
    private VocabularyService vocabularyService;

    /**
     * Get word definition from dictionary API
     * Requires user to be authenticated (STUDENT or TEACHER)
     * 
     * @param word The word to look up
     * @return Word definition or error
     */
    @GetMapping("/definition/{word}")
    @PreAuthorize("hasAnyAuthority('STUDENT', 'TEACHER', 'ADMIN')")
    public ResponseEntity<?> getWordDefinition(@PathVariable String word) {
        logger.info("Vocabulary lookup request for word: {}", word);
        return vocabularyService.getWordDefinition(word);
    }

    /**
     * Get cache statistics (admin only)
     * 
     * @return Cache statistics
     */
    @GetMapping("/cache/stats")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        return ResponseEntity.ok(vocabularyService.getCacheStats());
    }

    /**
     * Clear vocabulary cache (admin only)
     * 
     * @return Success message
     */
    @PostMapping("/cache/clear")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, String>> clearCache() {
        vocabularyService.clearCache();
        return ResponseEntity.ok(Map.of("message", "Cache cleared successfully"));
    }
}
