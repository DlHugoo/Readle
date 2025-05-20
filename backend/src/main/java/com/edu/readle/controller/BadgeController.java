package com.edu.readle.controller;

import com.edu.readle.dto.BadgeDTO;
import com.edu.readle.dto.UserBadgeDTO;
import com.edu.readle.service.BadgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RestController
@RequestMapping("/api/badges")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class BadgeController {
    private static final Logger logger = LoggerFactory.getLogger(BadgeController.class);
    private final BadgeService badgeService;

    @Autowired
    public BadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    @GetMapping
    public ResponseEntity<List<BadgeDTO>> getAllBadges() {
        return ResponseEntity.ok(badgeService.getAllBadges());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserBadgeDTO>> getUserBadges(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.getUserBadges(userId));
    }

    @GetMapping("/user/{userId}/earned")
    public ResponseEntity<List<UserBadgeDTO>> getUserEarnedBadges(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.getUserEarnedBadges(userId));
    }

    @GetMapping("/user/{userId}/in-progress")
    public ResponseEntity<List<UserBadgeDTO>> getUserInProgressBadges(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.getUserInProgressBadges(userId));
    }

    @PostMapping
    public ResponseEntity<BadgeDTO> createBadge(@RequestBody BadgeDTO badgeDTO) {
        return ResponseEntity.ok(badgeService.createBadge(badgeDTO));
    }

    @PutMapping("/user/{userId}/progress")
    public ResponseEntity<UserBadgeDTO> updateUserBadgeProgress(
            @PathVariable Long userId,
            @RequestParam String achievementCriteria,
            @RequestParam int progressValue) {
        return ResponseEntity.ok(badgeService.updateUserBadgeProgress(userId, achievementCriteria, progressValue));
    }

    @PostMapping("/user/{userId}/check-books")
    public ResponseEntity<List<UserBadgeDTO>> checkAndAwardBookRelatedBadges(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.checkAndAwardBookRelatedBadges(userId));
    }

    @PostMapping("/user/{userId}/login")
    public ResponseEntity<UserBadgeDTO> trackUserLogin(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.trackUserLogin(userId));
    }

    @PostMapping("/user/{userId}/book-completion")
    public ResponseEntity<UserBadgeDTO> trackBookCompletion(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.trackBookCompletion(userId));
    }

    @PostMapping("/user/{userId}/genre-read")
    public ResponseEntity<UserBadgeDTO> trackGenreRead(
            @PathVariable Long userId,
            @RequestParam String genre) {
        return ResponseEntity.ok(badgeService.trackGenreRead(userId, genre));
    }

    @PostMapping("/user/{userId}/reading-time")
    public ResponseEntity<UserBadgeDTO> trackReadingTime(
            @PathVariable Long userId,
            @RequestParam int minutes) {
        return ResponseEntity.ok(badgeService.trackReadingTime(userId, minutes));
    }

    @PostMapping("/user/{userId}/pages-read")
    public ResponseEntity<UserBadgeDTO> trackPagesRead(
            @PathVariable Long userId,
            @RequestParam int pages) {
        return ResponseEntity.ok(badgeService.trackPagesRead(userId, pages));
    }

    @PostMapping("/user/{userId}/check-all")
    public ResponseEntity<List<UserBadgeDTO>> checkAllBadgeProgress(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.checkAllBadgeProgress(userId));
    }
}