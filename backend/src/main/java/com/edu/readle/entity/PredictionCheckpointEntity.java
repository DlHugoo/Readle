package com.edu.readle.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.util.ArrayList;
import java.util.List;

@Entity
public class PredictionCheckpointEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long checkpointId;

    private String title;
    private Integer pageNumber;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private BookEntity book;

    @JsonManagedReference
    @OneToMany(mappedBy = "checkpoint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PredictionImageEntity> predictionImages = new ArrayList<>();

    @JsonManagedReference
    @OneToMany(mappedBy = "checkpoint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SequenceImageEntity> sequenceImages = new ArrayList<>();

    // Constructors
    public PredictionCheckpointEntity() {
    }

    public PredictionCheckpointEntity(String title, BookEntity book) {
        this.title = title;
        this.book = book;
    }

    // Getters and Setters
    public Long getCheckpointId() {
        return checkpointId;
    }

    public void setCheckpointId(Long checkpointId) {
        this.checkpointId = checkpointId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Integer getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(Integer pageNumber) {
        this.pageNumber = pageNumber;
    }

    public BookEntity getBook() {
        return book;
    }

    public void setBook(BookEntity book) {
        this.book = book;
    }

    public List<PredictionImageEntity> getPredictionImages() {
        return predictionImages;
    }

    public void setPredictionImages(List<PredictionImageEntity> predictionImages) {
        this.predictionImages = predictionImages;
    }

    public void addPredictionImage(PredictionImageEntity image) {
        image.setCheckpoint(this);
        this.predictionImages.add(image);
    }

    public void removePredictionImage(PredictionImageEntity image) {
        image.setCheckpoint(null);
        this.predictionImages.remove(image);
    }

    public List<SequenceImageEntity> getSequenceImages() {
        return sequenceImages;
    }

    public void setSequenceImages(List<SequenceImageEntity> sequenceImages) {
        this.sequenceImages = sequenceImages;
    }
}