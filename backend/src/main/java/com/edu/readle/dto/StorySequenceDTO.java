package com.edu.readle.dto;

import java.util.List;

public class StorySequenceDTO {
    private String title;
    private Long bookId;
    private List<ImageDTO> images;

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

    public List<ImageDTO> getImages() {
        return images;
    }

    public void setImages(List<ImageDTO> images) {
        this.images = images;
    }

    // Inner static class for image data
    public static class ImageDTO {
        private String imageUrl;
        private int correctPosition;

        // Getters and Setters

        public String getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }

        public int getCorrectPosition() {
            return correctPosition;
        }

        public void setCorrectPosition(int correctPosition) {
            this.correctPosition = correctPosition;
        }
    }
}
