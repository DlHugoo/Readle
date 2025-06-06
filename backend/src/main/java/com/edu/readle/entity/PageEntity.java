package com.edu.readle.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
public class PageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pageID;

    private int pageNumber;

    @Lob
    private String content;

    private String imageURL;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "book_id")
    private BookEntity book;

    // Constructors
    public PageEntity() {}

    public PageEntity(int pageNumber, String content, String imageURL, BookEntity book) {
        this.pageNumber = pageNumber;
        this.content = content;
        this.imageURL = imageURL;
        this.book = book;
    }

    // Getters and Setters

    public Long getPageID() {
        return pageID;
    }

    public void setPageID(Long pageID) {
        this.pageID = pageID;
    }

    public int getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(int pageNumber) {
        this.pageNumber = pageNumber;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageURL() {
        return imageURL;
    }

    public void setImageURL(String imageURL) {
        this.imageURL = imageURL;
    }

    public BookEntity getBook() {
        return book;
    }

    public void setBook(BookEntity book) {
        this.book = book;
    }
}
