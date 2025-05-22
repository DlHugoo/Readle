package com.edu.readle.dto;

import java.util.List;

public class PredictionCheckpointDTO {
    private String title;
    private Long bookId;
    private Integer pageNumber;
    private List<SequenceImageDTO> sequenceImages;
    private List<PredictionOptionDTO> predictionOptions;

    // Inner class for sequence images
    public static class SequenceImageDTO {
        private String imageUrl;
        private Integer position;

        // Getters and setters
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public Integer getPosition() { return position; }
        public void setPosition(Integer position) { this.position = position; }
    }

    // Inner class for prediction options
    public static class PredictionOptionDTO {
        private String imageUrl;
        private Boolean isCorrect;

        // Getters and setters
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public Boolean getIsCorrect() { return isCorrect; }
        public void setIsCorrect(Boolean isCorrect) { this.isCorrect = isCorrect; }
    }

    // Getters and setters for main class
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }
    public Integer getPageNumber() { return pageNumber; }
    public void setPageNumber(Integer pageNumber) { this.pageNumber = pageNumber; }
    public List<SequenceImageDTO> getSequenceImages() { return sequenceImages; }
    public void setSequenceImages(List<SequenceImageDTO> sequenceImages) { this.sequenceImages = sequenceImages; }
    public List<PredictionOptionDTO> getPredictionOptions() { return predictionOptions; }
    public void setPredictionOptions(List<PredictionOptionDTO> predictionOptions) { this.predictionOptions = predictionOptions; }
}