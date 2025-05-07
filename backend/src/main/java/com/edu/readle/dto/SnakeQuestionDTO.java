package com.edu.readle.dto;

public class SnakeQuestionDTO {
    private String text;
    private String answer;
    private Long bookId; // New field

    public SnakeQuestionDTO() {}

    public SnakeQuestionDTO(String text, String answer, Long bookId) {
        this.text = text;
        this.answer = answer;
        this.bookId = bookId;
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

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }
}
