package com.edu.readle.service;

import com.edu.readle.dto.SequenceCheckResponseDTO;
import com.edu.readle.entity.WordStorySequenceActivityEntity;
import com.edu.readle.entity.SequenceTextEntity;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.WordStorySequenceActivityRepository;
import com.edu.readle.repository.SequenceTextRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WordStorySequenceService {

    @Autowired
    private WordStorySequenceActivityRepository wssaRepo;

    @Autowired
    private SequenceTextRepository textRepo;

    @Autowired
    private WordSSAAttemptService wssaAttemptService;

    @Autowired
    private GeminiFeedbackService geminiFeedbackService;

    public WordStorySequenceActivityEntity getActivityByBookId(Long bookId) {
        return wssaRepo.findByBook_BookID(bookId)
                .orElseThrow(() -> new EntityNotFoundException("WSSA not found for book " + bookId));
    }

    public boolean checkSequence(Long wssaId, List<Long> attemptedSequence, UserEntity user) {
        WordStorySequenceActivityEntity wssa = wssaRepo.findById(wssaId)
                .orElseThrow(() -> new EntityNotFoundException("WSSA not found"));

        List<Long> correctIds = textRepo.findByWssaOrderByCorrectPosition(wssa)
                .stream()
                .map(SequenceTextEntity::getTextID)
                .toList();

        boolean isCorrect = correctIds.equals(attemptedSequence);

        wssaAttemptService.saveAttempt(user, wssa, attemptedSequence, isCorrect);

        return isCorrect;
    }

    /**
     * Check sequence and generate AI feedback
     * 
     * @param wssaId The WSSA activity ID
     * @param attemptedSequence The student's attempted sequence (list of text IDs)
     * @param user The user attempting the sequence
     * @return SequenceCheckResponseDTO with correctness and feedback
     */
    public SequenceCheckResponseDTO checkSequenceWithFeedback(Long wssaId, List<Long> attemptedSequence, UserEntity user) {
        WordStorySequenceActivityEntity wssa = wssaRepo.findById(wssaId)
                .orElseThrow(() -> new EntityNotFoundException("WSSA not found"));

        // Get correct sequence
        List<SequenceTextEntity> correctTexts = textRepo.findByWssaOrderByCorrectPosition(wssa);
        List<Long> correctIds = correctTexts.stream()
                .map(SequenceTextEntity::getTextID)
                .toList();

        // Get correct text content in order
        List<String> correctSequence = correctTexts.stream()
                .map(SequenceTextEntity::getTextContent)
                .collect(Collectors.toList());

        // Get attempted text content in order
        List<String> attemptedSequenceTexts = attemptedSequence.stream()
                .map(id -> textRepo.findById(id)
                        .map(SequenceTextEntity::getTextContent)
                        .orElse(""))
                .filter(text -> !text.isEmpty())
                .collect(Collectors.toList());

        boolean isCorrect = correctIds.equals(attemptedSequence);

        // Save attempt
        wssaAttemptService.saveAttempt(user, wssa, attemptedSequence, isCorrect);

        // Generate feedback using Gemini
        String feedback;
        if (isCorrect) {
            feedback = "Excellent work! You've arranged the story parts in the correct chronological order. Well done!";
        } else {
            try {
                String bookTitle = wssa.getBook() != null ? wssa.getBook().getTitle() : null;
                feedback = geminiFeedbackService.generateFeedback(
                    correctSequence,
                    attemptedSequenceTexts,
                    bookTitle
                );
            } catch (Exception e) {
                System.err.println("Error generating Gemini feedback: " + e.getMessage());
                // Fallback feedback
                feedback = "Good effort! Think about the order of events in the story. What happens first, and what comes next?";
            }
        }

        return new SequenceCheckResponseDTO(isCorrect, feedback);
    }
}

