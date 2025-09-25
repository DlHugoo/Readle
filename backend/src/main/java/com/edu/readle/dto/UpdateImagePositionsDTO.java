package com.edu.readle.dto;

import java.util.List;

public class UpdateImagePositionsDTO {
    private List<ImagePositionDTO> images;

    // Getters and Setters
    public List<ImagePositionDTO> getImages() {
        return images;
    }

    public void setImages(List<ImagePositionDTO> images) {
        this.images = images;
    }

    // Inner static class for image position data
    public static class ImagePositionDTO {
        private Long id;
        private int correctPosition;

        // Constructors
        public ImagePositionDTO() {}

        public ImagePositionDTO(Long id, int correctPosition) {
            this.id = id;
            this.correctPosition = correctPosition;
        }

        // Getters and Setters
        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public int getCorrectPosition() {
            return correctPosition;
        }

        public void setCorrectPosition(int correctPosition) {
            this.correctPosition = correctPosition;
        }
    }
}
