package com.edu.readle.dto;

public class SnakeAnswerDTO {
    private String answer;
    private boolean correct;

    public SnakeAnswerDTO() {}

    public SnakeAnswerDTO(String answer, boolean correct) {
        this.answer = answer;
        this.correct = correct;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }
}
