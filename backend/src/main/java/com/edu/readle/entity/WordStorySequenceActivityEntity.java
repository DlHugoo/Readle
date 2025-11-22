package com.edu.readle.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.util.ArrayList;
import java.util.List;

@Entity
public class WordStorySequenceActivityEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long wssaID;

    private String title;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id")
    private BookEntity book;

    @JsonManagedReference
    @OneToMany(mappedBy = "wssa", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SequenceTextEntity> sequenceTexts = new ArrayList<>();

    // Constructors
    public WordStorySequenceActivityEntity() {
    }

    public WordStorySequenceActivityEntity(String title, BookEntity book) {
        this.title = title;
        this.book = book;
    }

    // Getters and Setters
    public Long getWssaID() {
        return wssaID;
    }

    public void setWssaID(Long wssaID) {
        this.wssaID = wssaID;
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

    public List<SequenceTextEntity> getSequenceTexts() {
        return sequenceTexts;
    }

    public void setSequenceTexts(List<SequenceTextEntity> sequenceTexts) {
        this.sequenceTexts = sequenceTexts;
    }

    public void addSequenceText(SequenceTextEntity text) {
        text.setWssa(this);
        this.sequenceTexts.add(text);
    }

    public void removeSequenceText(SequenceTextEntity text) {
        text.setWssa(null);
        this.sequenceTexts.remove(text);
    }
}

