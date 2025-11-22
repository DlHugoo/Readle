package com.edu.readle.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
public class SequenceTextEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long textID;

    private String textContent;

    private int correctPosition;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wssa_id")
    private WordStorySequenceActivityEntity wssa;

    // Constructors
    public SequenceTextEntity() {
    }

    public SequenceTextEntity(String textContent, int correctPosition, WordStorySequenceActivityEntity wssa) {
        this.textContent = textContent;
        this.correctPosition = correctPosition;
        this.wssa = wssa;
    }

    // Getters and Setters
    public Long getTextID() {
        return textID;
    }

    public void setTextID(Long textID) {
        this.textID = textID;
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }

    public int getCorrectPosition() {
        return correctPosition;
    }

    public void setCorrectPosition(int correctPosition) {
        this.correctPosition = correctPosition;
    }

    public WordStorySequenceActivityEntity getWssa() {
        return wssa;
    }

    public void setWssa(WordStorySequenceActivityEntity wssa) {
        this.wssa = wssa;
    }
}

