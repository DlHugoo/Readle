package com.edu.readle.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.util.ArrayList;
import java.util.List;

@Entity
public class StorySequenceActivityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ssaID;

    private String title;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private BookEntity book;

    @JsonManagedReference
    @OneToMany(mappedBy = "ssa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SequenceImageEntity> sequenceImages = new ArrayList<>();

    // Constructors
    public StorySequenceActivityEntity() {
    }

    public StorySequenceActivityEntity(String title, BookEntity book) {
        this.title = title;
        this.book = book;
    }

    // Getters and Setters

    public Long getSsaID() {
        return ssaID;
    }

    public void setSsaID(Long ssaID) {
        this.ssaID = ssaID;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BookEntity getBook() {
        return book;
    }

    public void setBook(BookEntity book) {
        this.book = book;
    }

    public List<SequenceImageEntity> getSequenceImages() {
        return sequenceImages;
    }

    public void setSequenceImages(List<SequenceImageEntity> sequenceImages) {
        this.sequenceImages = sequenceImages;
    }

    public void addSequenceImage(SequenceImageEntity image) {
        image.setSsa(this);
        this.sequenceImages.add(image);
    }

    public void removeSequenceImage(SequenceImageEntity image) {
        image.setSsa(null);
        this.sequenceImages.remove(image);
    }
}
