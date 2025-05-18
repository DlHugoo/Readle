package com.edu.readle.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "badges")
public class BadgeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String badgeType; // GOLD, SILVER, BRONZE

    @Column
    private String imageUrl;

    @Column(nullable = false)
    private String achievementCriteria; // e.g., "BOOKS_READ", "VOCABULARY_MASTERED"

    @Column(nullable = false)
    private int thresholdValue; // e.g., 1 book, 20 synonyms

    // Constructors
    public BadgeEntity() {
    }

    public BadgeEntity(String name, String description, String badgeType, 
                      String imageUrl, String achievementCriteria, int thresholdValue) {
        this.name = name;
        this.description = description;
        this.badgeType = badgeType;
        this.imageUrl = imageUrl;
        this.achievementCriteria = achievementCriteria;
        this.thresholdValue = thresholdValue;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBadgeType() {
        return badgeType;
    }

    public void setBadgeType(String badgeType) {
        this.badgeType = badgeType;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getAchievementCriteria() {
        return achievementCriteria;
    }

    public void setAchievementCriteria(String achievementCriteria) {
        this.achievementCriteria = achievementCriteria;
    }

    public int getThresholdValue() {
        return thresholdValue;
    }

    public void setThresholdValue(int thresholdValue) {
        this.thresholdValue = thresholdValue;
    }
}