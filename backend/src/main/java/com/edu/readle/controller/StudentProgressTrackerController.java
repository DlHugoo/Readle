package com.edu.readle.controller;

import com.edu.readle.dto.StudentProgressDTO;
import com.edu.readle.service.BadgeService;
import com.edu.readle.service.StudentProgressTrackerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/progress")
@CrossOrigin(origins = {"http://localhost:5173", "https://readle-pi.vercel.app"}, allowCredentials = "true")
public class StudentProgressTrackerController {
    private static final Logger logger = LoggerFactory.getLogger(StudentProgressTrackerController.class);
    private final StudentProgressTrackerService progressTrackerService;
    private final BadgeService badgeService;

    public StudentProgressTrackerController(StudentProgressTrackerService progressTrackerService, 
                                           com.edu.readle.service.BadgeService badgeService) {
        this.progressTrackerService = progressTrackerService;
        this.badgeService = badgeService;
    }

    @PostMapping("/start/{userId}/{bookId}")
    public ResponseEntity<StudentProgressDTO> startReadingBook(
            @PathVariable Long userId,
            @PathVariable Long bookId) {
        return ResponseEntity.ok(progressTrackerService.startReadingBook(userId, bookId));
    }

    @PutMapping("/update/{trackerId}")
    public ResponseEntity<StudentProgressDTO> updateReadingProgress(
            @PathVariable Long trackerId,
            @RequestParam int pageNumber,
            @RequestParam double readingTimeMinutes) {
        // Convert fractional minutes to seconds to preserve precision
        long totalSeconds = Math.round(readingTimeMinutes * 60);
        Duration readingTime = Duration.ofSeconds(totalSeconds);
        return ResponseEntity.ok(progressTrackerService.updateReadingProgress(trackerId, pageNumber, readingTime));
    }

    @PutMapping("/complete/{trackerId}")
    public ResponseEntity<StudentProgressDTO> completeBook(@PathVariable Long trackerId) {
        // Complete the book and get the progress
        StudentProgressDTO progress = progressTrackerService.completeBook(trackerId);
        
        try {
            // Get the user ID from the service
            Long userId = progressTrackerService.getUserIdByTrackerId(trackerId);
            if (userId != null) {
                logger.info("Awarding book completion badge to user: {}", userId);
                badgeService.trackBookCompletion(userId);
                
                // Note: We don't need to explicitly call trackGenreRead here
                // as it's now handled in the StudentProgressTrackerService
            } else {
                logger.warn("User ID not found for tracker: {}", trackerId);
            }
        } catch (Exception e) {
            logger.error("Error awarding book completion badge", e);
            // We don't want to fail the book completion if badge awarding fails
        }
        
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/completed/{userId}")
    public ResponseEntity<List<StudentProgressDTO>> getCompletedBooks(@PathVariable Long userId) {
        return ResponseEntity.ok(progressTrackerService.getCompletedBooks(userId));
    }

    @GetMapping("/in-progress/{userId}")
    public ResponseEntity<List<StudentProgressDTO>> getInProgressBooks(@PathVariable Long userId) {
        return ResponseEntity.ok(progressTrackerService.getInProgressBooks(userId));
    }

    @GetMapping("/completed/count/{userId}")
    public ResponseEntity<Long> getCompletedBooksCount(@PathVariable Long userId) {
        logger.info("Getting completed books count for user: {}", userId);
        try {
            Long count = progressTrackerService.getCompletedBooksCount(userId);
            logger.info("Found {} completed books for user: {}", count, userId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            logger.error("Error getting completed books count for user: " + userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/in-progress/count/{userId}")
    public ResponseEntity<Long> getInProgressBooksCount(@PathVariable Long userId) {
        logger.info("Getting in-progress books count for user: {}", userId);
        try {
            Long count = progressTrackerService.getInProgressBooksCount(userId);
            logger.info("Found {} in-progress books for user: {}", count, userId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            logger.error("Error getting in-progress books count for user: " + userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/book/{userId}/{bookId}")
    public ResponseEntity<StudentProgressDTO> getBookProgress(
            @PathVariable Long userId,
            @PathVariable Long bookId) {
        try {
            StudentProgressDTO progress = progressTrackerService.getBookProgress(userId, bookId);
            return ResponseEntity.ok(progress);
        } catch (RuntimeException e) {
            logger.warn("No progress found for user {} and book {}: {}", userId, bookId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}