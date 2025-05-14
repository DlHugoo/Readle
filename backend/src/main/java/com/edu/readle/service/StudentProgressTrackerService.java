package com.edu.readle.service;

import com.edu.readle.entity.StudentProgressTrackerEntity;
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
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StudentProgressTrackerService {

    private final StudentProgressTrackerRepository progressTrackerRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    @Autowired
    public StudentProgressTrackerService(
            StudentProgressTrackerRepository progressTrackerRepository,
            UserRepository userRepository,
            BookRepository bookRepository) {
        this.progressTrackerRepository = progressTrackerRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    @Transactional
    public StudentProgressDTO startReadingBook(Long userId, Long bookId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        BookEntity book = bookRepository.findById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        // Check if already exists
        Optional<StudentProgressTrackerEntity> existingTracker = progressTrackerRepository.findByUserAndBook(user, book);
        if (existingTracker.isPresent()) {
            return convertToDTO(existingTracker.get());
        }

        StudentProgressTrackerEntity tracker = new StudentProgressTrackerEntity(user, book);
        return convertToDTO(progressTrackerRepository.save(tracker));
    }

    @Transactional
    public StudentProgressDTO updateReadingProgress(Long trackerId, int pageNumber, Duration readingTime) {
        StudentProgressTrackerEntity tracker = progressTrackerRepository.findById(trackerId)
                .orElseThrow(() -> new RuntimeException("Progress tracker not found"));

        tracker.setLastPageRead(pageNumber);
        tracker.updateReadingTime(readingTime);
        return convertToDTO(progressTrackerRepository.save(tracker));
    }

    @Transactional
    public StudentProgressDTO completeBook(Long trackerId) {
        StudentProgressTrackerEntity tracker = progressTrackerRepository.findById(trackerId)
                .orElseThrow(() -> new RuntimeException("Progress tracker not found"));

        tracker.completeBook();
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

    @Transactional
    public StudentProgressDTO updateComprehensionScore(Long trackerId, int score, Map<String, Integer> breakdown) {
        StudentProgressTrackerEntity tracker = progressTrackerRepository.findById(trackerId)
                .orElseThrow(() -> new RuntimeException("Progress tracker not found"));

        tracker.updateComprehensionScore(score, breakdown);
        return convertToDTO(progressTrackerRepository.save(tracker));
    }

    @Transactional
    public StudentProgressDTO updateVocabularyDevelopment(Long trackerId, int score, int newWordsLearned) {
        StudentProgressTrackerEntity tracker = progressTrackerRepository.findById(trackerId)
                .orElseThrow(() -> new RuntimeException("Progress tracker not found"));

        tracker.updateVocabularyDevelopment(score, newWordsLearned);
        return convertToDTO(progressTrackerRepository.save(tracker));
    }

    @Transactional
    public StudentProgressDTO updatePhonicsScore(Long trackerId, int score) {
        StudentProgressTrackerEntity tracker = progressTrackerRepository.findById(trackerId)
                .orElseThrow(() -> new RuntimeException("Progress tracker not found"));

        tracker.updatePhonicsScore(score);
        return convertToDTO(progressTrackerRepository.save(tracker));
    }

    // Get average scores for a user
    public Map<String, Double> getUserAverageScores(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<StudentProgressTrackerEntity> trackers = progressTrackerRepository.findByUser(user);
        
        double avgComprehension = trackers.stream()
                .mapToInt(StudentProgressTrackerEntity::getComprehensionScore)
                .filter(score -> score > 0)
                .average()
                .orElse(0.0);
                
        double avgVocabulary = trackers.stream()
                .mapToInt(StudentProgressTrackerEntity::getVocabularyScore)
                .filter(score -> score > 0)
                .average()
                .orElse(0.0);
                
        double avgPhonics = trackers.stream()
                .mapToInt(StudentProgressTrackerEntity::getPhonicsScore)
                .filter(score -> score > 0)
                .average()
                .orElse(0.0);
                
        int totalWordsLearned = trackers.stream()
                .mapToInt(StudentProgressTrackerEntity::getWordsLearned)
                .sum();
                
        Map<String, Double> scores = new java.util.HashMap<>();
        scores.put("comprehension", avgComprehension);
        scores.put("vocabulary", avgVocabulary);
        scores.put("phonics", avgPhonics);
        scores.put("wordsLearned", (double) totalWordsLearned);
        
        return scores;
    }

    private StudentProgressDTO convertToDTO(StudentProgressTrackerEntity tracker) {
        return new StudentProgressDTO(
            tracker.getId(),
            tracker.getBook(),
            tracker.isCompleted(),
            tracker.getStartTime(),
            tracker.getEndTime(),
            tracker.getTotalReadingTime(),
            tracker.getLastPageRead(),
            tracker.getLastReadAt(),
            tracker.getComprehensionScore(),
            tracker.getVocabularyScore(),
            tracker.getPhonicsScore(),
            tracker.getWordsLearned(),
            tracker.getComprehensionBreakdown()
        );
    }
}