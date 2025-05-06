package com.edu.readle.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.List;

@Entity
@Table(name = "stories")
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long storyId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String correctSequence;

    @JsonManagedReference
    @OneToMany(mappedBy = "story", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StoryImage> images;

    // Constructors
    public Story() {}

    public Story(String title, String correctSequence) {
        this.title = title;
        this.correctSequence = correctSequence;
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

    public List<StoryImage> getImages() {
        return images;
    }

    public void setImages(List<StoryImage> images) {
        this.images = images;
    }
}