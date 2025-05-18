package com.edu.readle.dto;

public class BadgeDTO {
    private Long id;
    private String name;
    private String description;
    private String badgeType;
    private String imageUrl;
    private String achievementCriteria;
    private int thresholdValue;

    // Constructor
    public BadgeDTO(Long id, String name, String description, String badgeType, 
                   String imageUrl, String achievementCriteria, int thresholdValue) {
        this.id = id;
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