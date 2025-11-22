package com.edu.readle.service;

import com.edu.readle.entity.WordStorySequenceActivityEntity;
import com.edu.readle.entity.SequenceTextEntity;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.WordStorySequenceActivityRepository;
import com.edu.readle.repository.SequenceTextRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class WordStorySequenceService {

    @Autowired
    private WordStorySequenceActivityRepository wssaRepo;

    @Autowired
    private SequenceTextRepository textRepo;

    @Autowired
    private WordSSAAttemptService wssaAttemptService;

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
}

