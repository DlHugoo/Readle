package com.edu.readle.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.Duration;

@Entity
@Table(name = "student_progress_tracker")
public class StudentProgressTracker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private BookEntity book;

    @Column(nullable = false)
    private boolean isCompleted;

    @Column
    private LocalDateTime startTime;

    @Column
    private LocalDateTime endTime;

    @Column
    private Duration totalReadingTime;

    @Column
    private int lastPageRead;

    @Column
    private LocalDateTime lastReadAt;

    // Constructors
    public StudentProgressTracker() {
        this.totalReadingTime = Duration.ZERO;
        this.lastPageRead = 0;
    }

    public StudentProgressTracker(UserEntity user, BookEntity book) {
        this.user = user;
        this.book = book;
        this.isCompleted = false;
        this.startTime = LocalDateTime.now();
        this.totalReadingTime = Duration.ZERO;
        this.lastPageRead = 0;
        this.lastReadAt = LocalDateTime.now();
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

    public boolean isCompleted() {
        return isCompleted;
    }

    public void setCompleted(boolean completed) {
        isCompleted = completed;
        if (completed && this.endTime == null) {
            this.endTime = LocalDateTime.now();
        }
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Duration getTotalReadingTime() {
        return totalReadingTime;
    }

    public void setTotalReadingTime(Duration totalReadingTime) {
        this.totalReadingTime = totalReadingTime;
    }

    public int getLastPageRead() {
        return lastPageRead;
    }

    public void setLastPageRead(int lastPageRead) {
        this.lastPageRead = lastPageRead;
        this.lastReadAt = LocalDateTime.now();
    }

    public LocalDateTime getLastReadAt() {
        return lastReadAt;
    }

    public void setLastReadAt(LocalDateTime lastReadAt) {
        this.lastReadAt = lastReadAt;
    }

    // Helper method to update reading time
    public void updateReadingTime(Duration additionalTime) {
        this.totalReadingTime = this.totalReadingTime.plus(additionalTime);
        this.lastReadAt = LocalDateTime.now();
    }

    // Helper method to mark book as completed
    public void completeBook() {
        this.isCompleted = true;
        this.endTime = LocalDateTime.now();
    }
} 