package com.edu.readle.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class PredictionCheckpointAttemptEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkpoint_id")
    private PredictionCheckpointEntity checkpoint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_image_id")
    private PredictionImageEntity selectedImage;

    private boolean isCorrect;
    private LocalDateTime attemptedAt;

    // Constructors
    public PredictionCheckpointAttemptEntity() {
    }

    // Getters and Setters
    public Long getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(Long attemptId) {
        this.attemptId = attemptId;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public PredictionCheckpointEntity getCheckpoint() {
        return checkpoint;
    }

    public void setCheckpoint(PredictionCheckpointEntity checkpoint) {
        this.checkpoint = checkpoint;
    }

    public PredictionImageEntity getSelectedImage() {
        return selectedImage;
    }

    public void setSelectedImage(PredictionImageEntity selectedImage) {
        this.selectedImage = selectedImage;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    public LocalDateTime getAttemptedAt() {
        return attemptedAt;
    }

    public void setAttemptedAt(LocalDateTime attemptedAt) {
        this.attemptedAt = attemptedAt;
    }
}