package com.edu.readle.dto;

import java.util.List;

public class WordStorySequenceDTO {
    private String title;
    private Long bookId;
    private List<TextDTO> texts;

    // Getters and Setters
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public List<TextDTO> getTexts() {
        return texts;
    }

    public void setTexts(List<TextDTO> texts) {
        this.texts = texts;
    }

    // Inner static class for text data
    public static class TextDTO {
        private String textContent;
        private int correctPosition;

        // Getters and Setters
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
    }
}

