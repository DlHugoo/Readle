package com.edu.readle.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_badges")
public class UserBadgeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    private BadgeEntity badge;

    @Column
    private LocalDateTime earnedAt;

    @Column
    private int currentProgress; // Track progress towards badge

    // Constructors
    public UserBadgeEntity() {
    }

    public UserBadgeEntity(UserEntity user, BadgeEntity badge) {
        this.user = user;
        this.badge = badge;
        this.earnedAt = null; // Will be set when badge is earned
        this.currentProgress = 0;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public BadgeEntity getBadge() {
        return badge;
    }

    public void setBadge(BadgeEntity badge) {
        this.badge = badge;
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

    // Helper method to update progress
    public boolean updateProgress(int newValue) {
        this.currentProgress = newValue;
        // Return true if badge is earned (progress meets threshold)
        return this.currentProgress >= this.badge.getThresholdValue();
    }
}