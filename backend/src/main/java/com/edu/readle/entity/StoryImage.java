package com.edu.readle.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
@Table(name = "story_images")
public class StoryImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String imageUrl;
    
    @Column(nullable = false)
    private Integer sequence;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "story_id", nullable = false)
    private Story story;

    // Constructors
    public StoryImage() {}

    public StoryImage(String imageUrl, Integer sequence, Story story) {
        this.imageUrl = imageUrl;
        this.sequence = sequence;
        this.story = story;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getSequence() {
        return sequence;
    }

    public void setSequence(Integer sequence) {
        this.sequence = sequence;
    }

    public Story getStory() {
        return story;
    }

    public void setStory(Story story) {
        this.story = story;
    }
}