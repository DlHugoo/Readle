package com.edu.readle.dto;

import java.time.LocalDateTime;

public class UserBadgeDTO {
    private Long id;
    private BadgeDTO badge;
    private boolean isEarned;
    private LocalDateTime earnedAt;
    private int currentProgress;
    private int requiredProgress;
    private double progressPercentage;

    // Constructor
    public UserBadgeDTO(Long id, BadgeDTO badge, boolean isEarned, 
                       LocalDateTime earnedAt, int currentProgress, int requiredProgress) {
        this.id = id;
        this.badge = badge;
        this.isEarned = isEarned;
        this.earnedAt = earnedAt;
        this.currentProgress = currentProgress;
        this.requiredProgress = requiredProgress;
        this.progressPercentage = requiredProgress > 0 
            ? Math.min(100.0, (currentProgress * 100.0) / requiredProgress) 
            : 0;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BadgeDTO getBadge() {
        return badge;
    }

    public void setBadge(BadgeDTO badge) {
        this.badge = badge;
    }

    public boolean isEarned() {
        return isEarned;
    }

    public void setEarned(boolean earned) {
        isEarned = earned;
    }

    public LocalDateTime getEarnedAt() {
        return earnedAt;
    }

    public void setEarnedAt(LocalDateTime earnedAt) {
        this.earnedAt = earnedAt;
    }

    public int getCurrentProgress() {
        return currentProgress;
    }

    public void setCurrentProgress(int currentProgress) {
        this.currentProgress = currentProgress;
    }

    public int getRequiredProgress() {
        return requiredProgress;
    }

    public void setRequiredProgress(int requiredProgress) {
        this.requiredProgress = requiredProgress;
    }

    public double getProgressPercentage() {
        return progressPercentage;
    }

    public void setProgressPercentage(double progressPercentage) {
        this.progressPercentage = progressPercentage;
    }
}