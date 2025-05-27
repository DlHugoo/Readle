package com.edu.readle.dto;

import java.time.LocalDateTime;

public class PredictionCheckpointAttemptDTO {
    private boolean isCorrect;
    private LocalDateTime attemptedAt;

    public PredictionCheckpointAttemptDTO(boolean isCorrect, LocalDateTime attemptedAt) {
        this.isCorrect = isCorrect;
        this.attemptedAt = attemptedAt;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public LocalDateTime getAttemptedAt() {
        return attemptedAt;
    }
} 