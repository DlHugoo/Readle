package com.edu.readle.entity;

import jakarta.persistence.*;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
public class BookEntity {

    @Id
    private String bookID;

    private String title;
    private String author;
    private String genre;
    private String difficultyLevel;
    private String filePath;
    private String imageURL;

     @JsonManagedReference
    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PageEntity> pages;

    // Constructors
    public BookEntity() {}

    public BookEntity(String bookID, String title, String author, String genre,
                String difficultyLevel, String filePath, String imageURL) {
        this.bookID = bookID;
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.difficultyLevel = difficultyLevel;
        this.filePath = filePath;
        this.imageURL = imageURL;
    }

    // Getters and Setters

    public String getBookID() {
        return bookID;
    }

    public void setBookID(String bookID) {
        this.bookID = bookID;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public String getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(String difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getImageURL() {
        return imageURL;
    }

    public void setImageURL(String imageURL) {
        this.imageURL = imageURL;
    }

    public List<PageEntity> getPages() {
        return pages;
    }

    public void setPages(List<PageEntity> pages) {
        this.pages = pages;
    }
}