package com.edu.readle.dto;

import java.util.List;

public class BookDTO {

    private Long bookID;
    private String title;
    private String author;
    private String genre;
    private int difficultyLevel; // Changed from String to int
    private String imageURL;
    private Long classroomId;
    private List<Long> pageIds; // Optional

    // Constructors
    public BookDTO() {}

    public BookDTO(Long bookID, String title, String author, String genre,
                   int difficultyLevel, String imageURL, Long classroomId, List<Long> pageIds) {
        this.bookID = bookID;
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.difficultyLevel = difficultyLevel;
        this.imageURL = imageURL;
        this.classroomId = classroomId;
        this.pageIds = pageIds;
    }

    public Long getBookID() {
        return bookID;
    }

    public void setBookID(Long bookID) {
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

    public int getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(int difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }

    public String getImageURL() {
        return imageURL;
    }

    public void setImageURL(String imageURL) {
        this.imageURL = imageURL;
    }

    public Long getClassroomId() {
        return classroomId;
    }

    public void setClassroomId(Long classroomId) {
        this.classroomId = classroomId;
    }

    public List<Long> getPageIds() {
        return pageIds;
    }

    public void setPageIds(List<Long> pageIds) {
        this.pageIds = pageIds;
    }
}
