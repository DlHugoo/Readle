package com.edu.readle.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class SSAAttemptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attemptID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ssa_id")
    private StorySequenceActivityEntity ssa;

    @ElementCollection
    @CollectionTable(name = "attempted_sequence", joinColumns = @JoinColumn(name = "attempt_id"))
    @Column(name = "image_id")
    private List<Long> attemptedSequence;

    private boolean isCorrect;

    private LocalDateTime attemptedAt;

    // Constructors
    public SSAAttemptEntity() {
    }

    public SSAAttemptEntity(UserEntity user, StorySequenceActivityEntity ssa,
            List<Long> attemptedSequence, boolean isCorrect) {
        this.user = user;
        this.ssa = ssa;
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

    public StorySequenceActivityEntity getSsa() {
        return ssa;
    }

    public void setSsa(StorySequenceActivityEntity ssa) {
        this.ssa = ssa;
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
