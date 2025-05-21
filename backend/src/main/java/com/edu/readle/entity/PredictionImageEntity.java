package com.edu.readle.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
public class PredictionImageEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageId;

    private String imageURL;
    private boolean isCorrect;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkpoint_id")
    private PredictionCheckpointEntity checkpoint;

    // Constructors
    public PredictionImageEntity() {
    }

    public PredictionImageEntity(String imageURL, boolean isCorrect, PredictionCheckpointEntity checkpoint) {
        this.imageURL = imageURL;
        this.isCorrect = isCorrect;
        this.checkpoint = checkpoint;
    }

    // Getters and Setters
    public Long getImageId() {
        return imageId;
    }

    public void setImageId(Long imageId) {
        this.imageId = imageId;
    }

    public String getImageURL() {
        return imageURL;
    }

    public void setImageURL(String imageURL) {
        this.imageURL = imageURL;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    public PredictionCheckpointEntity getCheckpoint() {
        return checkpoint;
    }

    public void setCheckpoint(PredictionCheckpointEntity checkpoint) {
        this.checkpoint = checkpoint;
    }
}