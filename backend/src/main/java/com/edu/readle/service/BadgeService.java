package com.edu.readle.service;

import com.edu.readle.dto.BadgeDTO;
import com.edu.readle.dto.UserBadgeDTO;
import com.edu.readle.entity.BadgeEntity;
import com.edu.readle.entity.UserBadgeEntity;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.entity.Role;  // Add this import
import com.edu.readle.repository.BadgeRepository;
import com.edu.readle.repository.UserBadgeRepository;
import com.edu.readle.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;

    @Autowired
    public BadgeService(BadgeRepository badgeRepository, 
                       UserBadgeRepository userBadgeRepository,
                       UserRepository userRepository) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.userRepository = userRepository;
    }

    // Get all badges
    public List<BadgeDTO> getAllBadges() {
        return badgeRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get user's badges
    public List<UserBadgeDTO> getUserBadges(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return userBadgeRepository.findByUser(user).stream()
                .map(this::convertToUserBadgeDTO)
                .collect(Collectors.toList());
    }

    // Get user's earned badges
    public List<UserBadgeDTO> getUserEarnedBadges(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return userBadgeRepository.findEarnedBadgesByUser(user).stream()
                .map(this::convertToUserBadgeDTO)
                .collect(Collectors.toList());
    }

    // Get user's in-progress badges
    public List<UserBadgeDTO> getUserInProgressBadges(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return userBadgeRepository.findInProgressBadgesByUser(user).stream()
                .map(this::convertToUserBadgeDTO)
                .collect(Collectors.toList());
    }

    // Create a new badge
    @Transactional
    public BadgeDTO createBadge(BadgeDTO badgeDTO) {
        BadgeEntity badge = new BadgeEntity(
                badgeDTO.getName(),
                badgeDTO.getDescription(),
                badgeDTO.getBadgeType(),
                badgeDTO.getImageUrl(),
                badgeDTO.getAchievementCriteria(),
                badgeDTO.getThresholdValue()
        );
        
        return convertToDTO(badgeRepository.save(badge));
    }

    // Update user's progress towards a badge
    @Transactional
    public UserBadgeDTO updateUserBadgeProgress(Long userId, String achievementCriteria, int progressValue) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Skip badge updates for non-student users
        if (user.getRole() != null && user.getRole() != Role.STUDENT) {
            // Create a dummy response with zero progress for non-students
            BadgeEntity dummyBadge = badgeRepository.findByAchievementCriteria(achievementCriteria)
                .stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No badges found with criteria: " + achievementCriteria));
            
            BadgeDTO badgeDTO = convertToDTO(dummyBadge);
            return new UserBadgeDTO(null, badgeDTO, false, null, 0, dummyBadge.getThresholdValue());
        }
        
        // Find all badges with this criteria
        List<BadgeEntity> badges = badgeRepository.findByAchievementCriteria(achievementCriteria);
        if (badges.isEmpty()) {
            throw new RuntimeException("No badges found with criteria: " + achievementCriteria);
        }
        
        // For simplicity, we'll use the first badge found
        BadgeEntity badge = badges.get(0);
        
        // Find or create user badge
        Optional<UserBadgeEntity> existingUserBadge = userBadgeRepository.findByUserAndBadge(user, badge);
        UserBadgeEntity userBadge;
        
        if (existingUserBadge.isPresent()) {
            userBadge = existingUserBadge.get();
            boolean isNewlyEarned = userBadge.updateProgress(progressValue);
            
            // If badge was just earned, update the earned time
            if (isNewlyEarned && userBadge.getEarnedAt() == null) {
                userBadge.setEarnedAt(LocalDateTime.now());
            }
        } else {
            userBadge = new UserBadgeEntity(user, badge);
            userBadge.setCurrentProgress(progressValue);
            
            // If already earned on creation
            if (progressValue >= badge.getThresholdValue()) {
                userBadge.setEarnedAt(LocalDateTime.now());
            }
        }
        
        return convertToUserBadgeDTO(userBadgeRepository.save(userBadge));
    }

    // Check and award badges based on completed books
    @Transactional
    public List<UserBadgeDTO> checkAndAwardBookRelatedBadges(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Get completed books count
        // This would typically come from StudentProgressTrackerService
        // For now, we'll simulate it
        Long completedBooksCount = 0L; // Replace with actual service call
        
        // Update "Bookworm" badge progress
        UserBadgeDTO bookwormBadge = updateUserBadgeProgress(userId, "BOOKS_READ", completedBooksCount.intValue());
        
        // Return list of updated badges
        return List.of(bookwormBadge);
    }

    // Convert entity to DTO
    private BadgeDTO convertToDTO(BadgeEntity badge) {
        return new BadgeDTO(
                badge.getId(),
                badge.getName(),
                badge.getDescription(),
                badge.getBadgeType(),
                badge.getImageUrl(),
                badge.getAchievementCriteria(),
                badge.getThresholdValue()
        );
    }

    // Convert user badge entity to DTO
    private UserBadgeDTO convertToUserBadgeDTO(UserBadgeEntity userBadge) {
        BadgeDTO badgeDTO = convertToDTO(userBadge.getBadge());
        boolean isEarned = userBadge.getCurrentProgress() >= userBadge.getBadge().getThresholdValue();
        
        return new UserBadgeDTO(
                userBadge.getId(),
                badgeDTO,
                isEarned,
                userBadge.getEarnedAt(),
                userBadge.getCurrentProgress(),
                userBadge.getBadge().getThresholdValue()
        );
    }

    // Track user login and award "Welcome Aboard" badge
    @Transactional
    public UserBadgeDTO trackUserLogin(Long userId) {
        return updateUserBadgeProgress(userId, "LOGIN_COUNT", 1);
    }

    // Track book completion and award "Bookworm" badge
    @Transactional
    public UserBadgeDTO trackBookCompletion(Long userId) {
        return updateUserBadgeProgress(userId, "BOOKS_COMPLETED", 1);
    }

    // Track genres read and award "Genre Explorer" badge
    @Transactional
    public UserBadgeDTO trackGenreRead(Long userId, String genre) {
        // Get the user
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Find the badge for genre exploration
        List<BadgeEntity> badges = badgeRepository.findByAchievementCriteria("GENRES_READ");
        if (badges.isEmpty()) {
            throw new RuntimeException("No badges found with criteria: GENRES_READ");
        }
        
        BadgeEntity badge = badges.get(0);
        
        // Find or create user badge
        Optional<UserBadgeEntity> existingUserBadge = userBadgeRepository.findByUserAndBadge(user, badge);
        UserBadgeEntity userBadge;
        
        // We'll use a simple approach to track genres by storing them in a comma-separated list
        // In a real application, you might want to use a separate table for this
        if (existingUserBadge.isPresent()) {
            userBadge = existingUserBadge.get();
            
            // Get the current progress (number of unique genres)
            int currentProgress = userBadge.getCurrentProgress();
            
            // Check if this is a new genre for the user
            // For simplicity, we'll just increment the counter if it's a new genre
            // In a real application, you would check if the genre is already in the list
            userBadge.updateProgress(currentProgress + 1);
            
            // If badge was just earned, update the earned time
            if (userBadge.getCurrentProgress() >= badge.getThresholdValue() && userBadge.getEarnedAt() == null) {
                userBadge.setEarnedAt(LocalDateTime.now());
            }
        } else {
            userBadge = new UserBadgeEntity(user, badge);
            userBadge.setCurrentProgress(1); // First genre
            
            // If already earned on creation
            if (1 >= badge.getThresholdValue()) {
                userBadge.setEarnedAt(LocalDateTime.now());
            }
        }
        
        return convertToUserBadgeDTO(userBadgeRepository.save(userBadge));
    }

    // Track reading time and award "Reading Marathoner" badge
    @Transactional
    public UserBadgeDTO trackReadingTime(Long userId, int minutesRead) {
        return updateUserBadgeProgress(userId, "READING_TIME", minutesRead);
    }

    // Track pages read and award "Page Turner" badge
    @Transactional
    public UserBadgeDTO trackPagesRead(Long userId, int pagesRead) {
        return updateUserBadgeProgress(userId, "PAGES_READ", pagesRead);
    }

    // Check all badge progress for a user
    @Transactional
    public List<UserBadgeDTO> checkAllBadgeProgress(Long userId) {
        List<UserBadgeDTO> updatedBadges = new ArrayList<>();
        
        // Check each achievement criteria
        // In a real implementation, you would get these values from other services
        int loginCount = 1; // Example value
        int booksCompleted = 0; // Example value
        int genresRead = 0; // Example value
        int readingTimeMinutes = 0; // Example value
        int pagesRead = 0; // Example value
        
        updatedBadges.add(updateUserBadgeProgress(userId, "LOGIN_COUNT", loginCount));
        updatedBadges.add(updateUserBadgeProgress(userId, "BOOKS_COMPLETED", booksCompleted));
        updatedBadges.add(updateUserBadgeProgress(userId, "GENRES_READ", genresRead));
        updatedBadges.add(updateUserBadgeProgress(userId, "READING_TIME", readingTimeMinutes));
        updatedBadges.add(updateUserBadgeProgress(userId, "PAGES_READ", pagesRead));
        
        return updatedBadges;
    }
}