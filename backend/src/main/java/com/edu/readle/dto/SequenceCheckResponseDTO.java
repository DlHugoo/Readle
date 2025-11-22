package com.edu.readle.dto;

public class SequenceCheckResponseDTO {
    private boolean correct;
    private String feedback;

    public SequenceCheckResponseDTO() {
    }

    public SequenceCheckResponseDTO(boolean correct, String feedback) {
        this.correct = correct;
        this.feedback = feedback;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}

