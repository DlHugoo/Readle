package com.edu.readle.dto;

public class StorySequenceProgressDTO {
    private Long ssaId;
    private String title;
    private boolean finished;

    public StorySequenceProgressDTO(Long ssaId, String title, boolean finished) {
        this.ssaId = ssaId;
        this.title = title;
        this.finished = finished;
    }

    public Long getSsaId() {
        return ssaId;
    }

    public void setSsaId(Long ssaId) {
        this.ssaId = ssaId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public boolean isFinished() {
        return finished;
    }

    public void setFinished(boolean finished) {
        this.finished = finished;
    }
} 