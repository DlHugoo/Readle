package com.edu.readle.dto;

import java.util.List;

public class StorySequencingDTO {
    private Long storyId;
    private String title;
    private String correctSequence;
    private List<StoryImageDTO> images;

    // Nested DTO for StoryImage
    public static class StoryImageDTO {
        private Long imageId;
        private String imageURL;
        private int sequenceNumber;

        // Getters and Setters
        public Long getImageId() {
            return imageId;
        }

        public void setImageId(Long imageId) {
            this.imageId = imageId;
        }

        public String getImageURL() {
            return imageURL;
        }

        public void setImageURL(String imageURL) {
            this.imageURL = imageURL;
        }

        public int getSequenceNumber() {
            return sequenceNumber;
        }

        public void setSequenceNumber(int sequenceNumber) {
            this.sequenceNumber = sequenceNumber;
        }
    }

    // Getters and Setters
    public Long getStoryId() {
        return storyId;
    }

    public void setStoryId(Long storyId) {
        this.storyId = storyId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCorrectSequence() {
        return correctSequence;
    }

    public void setCorrectSequence(String correctSequence) {
        this.correctSequence = correctSequence;
    }

    public List<StoryImageDTO> getImages() {
        return images;
    }

    public void setImages(List<StoryImageDTO> images) {
        this.images = images;
    }
}