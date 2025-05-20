package com.edu.readle.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;

@Entity
public class BookEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long bookID;

    private String title;
    private String author;
    private String genre;
    private int difficultyLevel; // Changed from String to int
    private String imageURL;

    @Column(nullable = false)
    private boolean visibleToAll = false;

    @Column
    private Long createdByAdminId;

    @JsonManagedReference
    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PageEntity> pages;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @JsonManagedReference
    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SnakeQuestionEntity> snakeQuestions = new ArrayList<>();

    // Constructors
    public BookEntity() {}

    public BookEntity(String title, String author, String genre,
                      int difficultyLevel, String imageURL) { // Updated parameter type
        this.title = title;
        this.author = author;
        this.genre = genre;
        this.difficultyLevel = difficultyLevel;
        this.imageURL = imageURL;
    }

    // Getters and Setters
    public boolean isVisibleToAll() {
        return visibleToAll;
    }

    public void setVisibleToAll(boolean visibleToAll) {
        this.visibleToAll = visibleToAll;
    }

    public Long getCreatedByAdminId() {
        return createdByAdminId;
    }

    public void setCreatedByAdminId(Long createdByAdminId) {
        this.createdByAdminId = createdByAdminId;
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

    public int getDifficultyLevel() { // Updated return type
        return difficultyLevel;
    }

    public void setDifficultyLevel(int difficultyLevel) { // Updated parameter type
        this.difficultyLevel = difficultyLevel;
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

    public Classroom getClassroom() {
        return classroom;
    }

    public void setClassroom(Classroom classroom) {
        this.classroom = classroom;
    }
    

    public List<SnakeQuestionEntity> getSnakeQuestions() {
        return snakeQuestions;
    }
    
    public void setSnakeQuestions(List<SnakeQuestionEntity> snakeQuestions) {
        this.snakeQuestions = snakeQuestions;
    }

    public void addSnakeQuestion(SnakeQuestionEntity question) {
        question.setBook(this);
        this.snakeQuestions.add(question);
    }
    
    public void removeSnakeQuestion(SnakeQuestionEntity question) {
        question.setBook(null);
        this.snakeQuestions.remove(question);
    }
}
