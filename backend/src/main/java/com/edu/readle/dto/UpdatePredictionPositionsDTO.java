package com.edu.readle.dto;

import java.util.List;

public class UpdatePredictionPositionsDTO {

    private List<StoryImageUpdate> storyImages;
    private List<OptionImageUpdate> optionImages;

    public List<StoryImageUpdate> getStoryImages() {
        return storyImages;
    }

    public void setStoryImages(List<StoryImageUpdate> storyImages) {
        this.storyImages = storyImages;
    }

    public List<OptionImageUpdate> getOptionImages() {
        return optionImages;
    }

    public void setOptionImages(List<OptionImageUpdate> optionImages) {
        this.optionImages = optionImages;
    }

    public static class StoryImageUpdate {
        private Long id;
        private Integer position;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Integer getPosition() {
            return position;
        }

        public void setPosition(Integer position) {
            this.position = position;
        }
    }

    public static class OptionImageUpdate {
        private Long id;
        private Boolean isCorrect;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Boolean getIsCorrect() {
            return isCorrect;
        }

        public void setIsCorrect(Boolean isCorrect) {
            this.isCorrect = isCorrect;
        }
    }
}
