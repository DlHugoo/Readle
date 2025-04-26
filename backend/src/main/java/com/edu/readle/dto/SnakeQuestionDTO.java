package com.edu.readle.dto;

import java.util.List;

public class SnakeQuestionDTO {
    private String text;
    private List<SnakeAnswerDTO> answers;

    public SnakeQuestionDTO() {}

    public SnakeQuestionDTO(String text, List<SnakeAnswerDTO> answers) {
        this.text = text;
        this.answers = answers;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<SnakeAnswerDTO> getAnswers() {
        return answers;
    }

    public void setAnswers(List<SnakeAnswerDTO> answers) {
        this.answers = answers;
    }
}
