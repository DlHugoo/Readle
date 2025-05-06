package com.edu.readle.dto;

public class SnakeQuestionDTO {
    private String text;
    private String answer; // Single answer (not a List)

    public SnakeQuestionDTO() {}

    // Updated constructor to match the fields (no List<SnakeAnswerDTO>)
    public SnakeQuestionDTO(String text, String answer) {
        this.text = text;
        this.answer = answer;
    }

    // Getters and setters
    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }
}
