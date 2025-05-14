package com.edu.readle.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class SnakeGameAttemptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user; // Each attempt belongs to one user

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private BookEntity book; // Each attempt belongs to one book

    private int score;
    private LocalDateTime attemptTime;

    // Constructors
    public SnakeGameAttemptEntity() {}

    public SnakeGameAttemptEntity(UserEntity user, BookEntity book, int score, LocalDateTime attemptTime) {
        this.user = user;
        this.book = book;
        this.score = score;
        this.attemptTime = attemptTime;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public BookEntity getBook() {
        return book;
    }

    public void setBook(BookEntity book) {
        this.book = book;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public LocalDateTime getAttemptTime() {
        return attemptTime;
    }

    public void setAttemptTime(LocalDateTime attemptTime) {
        this.attemptTime = attemptTime;
    }
}
