package com.edu.readle.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class WordSSAAttemptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wssa_id")
    private WordStorySequenceActivityEntity wssa;

    @ElementCollection
    @CollectionTable(name = "word_attempted_sequence", joinColumns = @JoinColumn(name = "attempt_id"))
    @Column(name = "text_id")
    private List<Long> attemptedSequence;

    private boolean isCorrect;

    private LocalDateTime attemptedAt;

    // Constructors
    public WordSSAAttemptEntity() {
    }

    public WordSSAAttemptEntity(UserEntity user, WordStorySequenceActivityEntity wssa,
            List<Long> attemptedSequence, boolean isCorrect) {
        this.user = user;
        this.wssa = wssa;
        this.attemptedSequence = attemptedSequence;
        this.isCorrect = isCorrect;
        this.attemptedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getAttemptID() {
        return attemptID;
    }

    public void setAttemptID(Long attemptID) {
        this.attemptID = attemptID;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public WordStorySequenceActivityEntity getWssa() {
        return wssa;
    }

    public void setWssa(WordStorySequenceActivityEntity wssa) {
        this.wssa = wssa;
    }

    public List<Long> getAttemptedSequence() {
        return attemptedSequence;
    }

    public void setAttemptedSequence(List<Long> attemptedSequence) {
        this.attemptedSequence = attemptedSequence;
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

