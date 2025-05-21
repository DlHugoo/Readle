package com.edu.readle.service;

import com.edu.readle.entity.StudentProgressTracker;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.entity.BookEntity;
import com.edu.readle.repository.StudentProgressTrackerRepository;
import com.edu.readle.repository.UserRepository;
import com.edu.readle.repository.BookRepository;
import com.edu.readle.dto.StudentProgressDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StudentProgressTrackerService {

    private final StudentProgressTrackerRepository progressTrackerRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;
    private final BadgeService badgeService; // Add this field

    @Autowired
    public StudentProgressTrackerService(
            StudentProgressTrackerRepository progressTrackerRepository,
            UserRepository userRepository,
            BookRepository bookRepository,
            BadgeService badgeService) { // Add this parameter
        this.progressTrackerRepository = progressTrackerRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
        this.badgeService = badgeService; // Initialize the field
    }

    @Transactional
    public StudentProgressDTO startReadingBook(Long userId, Long bookId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        // Check if already exists
        Optional<StudentProgressTracker> existingTracker = progressTrackerRepository.findByUserAndBook(user, book);
        if (existingTracker.isPresent()) {
            return convertToDTO(existingTracker.get());
        }

        StudentProgressTracker tracker = new StudentProgressTracker(user, book);
        return convertToDTO(progressTrackerRepository.save(tracker));
    }

    @Transactional
    public StudentProgressDTO updateReadingProgress(Long trackerId, int pageNumber, Duration readingTime) {
        StudentProgressTracker tracker = progressTrackerRepository.findById(trackerId)
                .orElseThrow(() -> new RuntimeException("Progress tracker not found"));

        // Calculate pages read since last update
        int previousPage = tracker.getLastPageRead();
        int pagesRead = pageNumber - previousPage;
        
        // Update tracker with new page number
        tracker.setLastPageRead(pageNumber);
        tracker.updateReadingTime(readingTime);
        
        // Track reading time for badge progress (convert Duration to minutes)
        Long userId = tracker.getUser().getId();
        int minutesRead = (int) readingTime.toMinutes();
        if (minutesRead > 0) {
            badgeService.trackReadingTime(userId, minutesRead);
        }
        
        // Track pages read for badge progress (only if positive progress)
        if (pagesRead > 0) {
            badgeService.trackPagesRead(userId, pagesRead);
        }
        
        return convertToDTO(progressTrackerRepository.save(tracker));
    }

    @Transactional
    public StudentProgressDTO completeBook(Long trackerId) {
        StudentProgressTracker tracker = progressTrackerRepository.findById(trackerId)
                .orElseThrow(() -> new RuntimeException("Progress tracker not found"));

        tracker.completeBook();
        
        // Track the genre for badge progress
        BookEntity book = tracker.getBook();
        if (book != null && book.getGenre() != null && !book.getGenre().isEmpty()) {
            badgeService.trackGenreRead(tracker.getUser().getId(), book.getGenre());
        }
        
        return convertToDTO(progressTrackerRepository.save(tracker));
    }

    public List<StudentProgressDTO> getCompletedBooks(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return progressTrackerRepository.findCompletedBooksByUser(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<StudentProgressDTO> getInProgressBooks(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return progressTrackerRepository.findInProgressBooksByUser(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Long getCompletedBooksCount(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return progressTrackerRepository.countCompletedBooksByUser(user);
    }

    public Long getInProgressBooksCount(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return progressTrackerRepository.countInProgressBooksByUser(user);
    }

    public StudentProgressDTO getBookProgress(Long userId, Long bookId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        return progressTrackerRepository.findByUserAndBook(user, book)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("No progress found for this book"));
    }

    private StudentProgressDTO convertToDTO(StudentProgressTracker tracker) {
        return new StudentProgressDTO(
            tracker.getId(),
            tracker.getBook(),
            tracker.isCompleted(),
            tracker.getStartTime(),
            tracker.getEndTime(),
            tracker.getTotalReadingTime(),
            tracker.getLastPageRead(),
            tracker.getLastReadAt()
        );
    }

    /**
     * Get the user ID associated with a progress tracker
     */
    public Long getUserIdByTrackerId(Long trackerId) {
        StudentProgressTracker tracker = progressTrackerRepository.findById(trackerId)
                .orElseThrow(() -> new RuntimeException("Progress tracker not found"));
        return tracker.getUser().getId();
    }
}