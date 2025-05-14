package com.edu.readle.dto;

import com.edu.readle.entity.BookEntity;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.stream.Collectors;

public class StudentProgressDTO {
    private Long id;
    private BookDTO book;
    private boolean isCompleted;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Duration totalReadingTime;
    private int lastPageRead;
    private LocalDateTime lastReadAt;

    // Constructor
    public StudentProgressDTO(Long id, BookEntity book, boolean isCompleted, 
                            LocalDateTime startTime, LocalDateTime endTime,
                            Duration totalReadingTime, int lastPageRead,
                            LocalDateTime lastReadAt) {
        this.id = id;
        this.book = new BookDTO(
            book.getBookID(),
            book.getTitle(),
            book.getAuthor(),
            book.getGenre(),
            book.getDifficultyLevel(),
            book.getImageURL(),
            book.getClassroom() != null ? book.getClassroom().getId() : null,
            book.getPages() != null ? book.getPages().stream().map(page -> page.getPageID()).collect(Collectors.toList()) : null
        );
        this.isCompleted = isCompleted;
        this.startTime = startTime;
        this.endTime = endTime;
        this.totalReadingTime = totalReadingTime;
        this.lastPageRead = lastPageRead;
        this.lastReadAt = lastReadAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BookDTO getBook() {
        return book;
    }

    public void setBook(BookDTO book) {
        this.book = book;
    }

    public boolean isCompleted() {
        return isCompleted;
    }

    public void setCompleted(boolean completed) {
        isCompleted = completed;
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
    }

    public LocalDateTime getLastReadAt() {
        return lastReadAt;
    }

    public void setLastReadAt(LocalDateTime lastReadAt) {
        this.lastReadAt = lastReadAt;
    }

    public long getTotalReadingTimeSeconds() {
        return totalReadingTime != null ? totalReadingTime.getSeconds() : 0;
    }

    public long getTotalReadingTimeMinutes() {
        return totalReadingTime != null ? totalReadingTime.toMinutes() : 0;
    }
}