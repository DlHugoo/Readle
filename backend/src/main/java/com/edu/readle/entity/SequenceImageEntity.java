package com.edu.readle.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
public class SequenceImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long imageID;

    private String imageURL;

    private int correctPosition;

    // For StorySequenceActivity
    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ssa_id")
    private StorySequenceActivityEntity ssa;

    // For PredictionCheckpoint
    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "checkpoint_id", nullable = true)
    private PredictionCheckpointEntity checkpoint;

    // Constructors
    public SequenceImageEntity() {
    }

    public SequenceImageEntity(String imageURL, int correctPosition, StorySequenceActivityEntity ssa) {
        this.imageURL = imageURL;
        this.correctPosition = correctPosition;
        this.ssa = ssa;
    }

    // Getters and Setters

    public Long getImageID() {
        return imageID;
    }

    public void setImageID(Long imageID) {
        this.imageID = imageID;
    }

    public String getImageURL() {
        return imageURL;
    }

    public void setImageURL(String imageURL) {
        this.imageURL = imageURL;
    }

    public int getCorrectPosition() {
        return correctPosition;
    }

    public void setCorrectPosition(int correctPosition) {
        this.correctPosition = correctPosition;
    }

    public StorySequenceActivityEntity getSsa() {
        return ssa;
    }

    public void setSsa(StorySequenceActivityEntity ssa) {
        this.ssa = ssa;
    }

    public PredictionCheckpointEntity getCheckpoint() {
        return checkpoint;
    }

    public void setCheckpoint(PredictionCheckpointEntity checkpoint) {
        this.checkpoint = checkpoint;
    }
}
