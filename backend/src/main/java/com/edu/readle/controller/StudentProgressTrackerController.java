package com.edu.readle.controller;

import com.edu.readle.dto.StudentProgressDTO;
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
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class StudentProgressTrackerController {
    private static final Logger logger = LoggerFactory.getLogger(StudentProgressTrackerController.class);
    private final StudentProgressTrackerService progressTrackerService;

    @Autowired
    public StudentProgressTrackerController(StudentProgressTrackerService progressTrackerService) {
        this.progressTrackerService = progressTrackerService;
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
            @RequestParam long readingTimeMinutes) {
        Duration readingTime = Duration.ofMinutes(readingTimeMinutes);
        return ResponseEntity.ok(progressTrackerService.updateReadingProgress(trackerId, pageNumber, readingTime));
    }

    @PutMapping("/complete/{trackerId}")
    public ResponseEntity<StudentProgressDTO> completeBook(@PathVariable Long trackerId) {
        return ResponseEntity.ok(progressTrackerService.completeBook(trackerId));
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
        return ResponseEntity.ok(progressTrackerService.getBookProgress(userId, bookId));
    }
} 