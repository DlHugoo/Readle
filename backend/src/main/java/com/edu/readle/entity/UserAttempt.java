package com.edu.readle.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user_attempts")
public class UserAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    @Column(nullable = false)
    private String submittedSequence;

    @Column(nullable = false)
    private int attemptsRemaining;

    @Column(nullable = false)
    private boolean isCorrect;

    // Constructors
    public UserAttempt() {}

    public UserAttempt(UserEntity user, Story story, String submittedSequence, int attemptsRemaining, boolean isCorrect) {
        this.user = user;
        this.story = story;
        this.submittedSequence = submittedSequence;
        this.attemptsRemaining = attemptsRemaining;
        this.isCorrect = isCorrect;
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

    public Story getStory() {
        return story;
    }

    public void setStory(Story story) {
        this.story = story;
    }

    public String getSubmittedSequence() {
        return submittedSequence;
    }

    public void setSubmittedSequence(String submittedSequence) {
        this.submittedSequence = submittedSequence;
    }

    public int getAttemptsRemaining() {
        return attemptsRemaining;
    }

    public void setAttemptsRemaining(int attemptsRemaining) {
        this.attemptsRemaining = attemptsRemaining;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public void setCorrect(boolean correct) {
        isCorrect = correct;
    }

    // Helper method to save an attempt
    public void saveAttempt() {
        this.attemptsRemaining--;
    }
}