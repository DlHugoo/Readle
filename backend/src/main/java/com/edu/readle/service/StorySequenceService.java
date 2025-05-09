package com.edu.readle.service;

import com.edu.readle.entity.StorySequenceActivityEntity;
import com.edu.readle.entity.SequenceImageEntity;
import com.edu.readle.entity.SSAAttemptEntity;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.StorySequenceActivityRepository;
import com.edu.readle.repository.SequenceImageRepository;
import com.edu.readle.repository.SSAAttemptRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StorySequenceService {

    @Autowired
    private StorySequenceActivityRepository ssaRepo;

    @Autowired
    private SequenceImageRepository imageRepo;

    @Autowired
    private SSAAttemptRepository attemptRepo;

    public StorySequenceActivityEntity getActivityByBookId(Long bookId) {
        return ssaRepo.findByBook_BookID(bookId)
                .orElseThrow(() -> new EntityNotFoundException("SSA not found for book " + bookId));
    }

    public boolean checkSequence(Long ssaId, List<Long> attemptedSequence, UserEntity user) {
        StorySequenceActivityEntity ssa = ssaRepo.findById(ssaId)
                .orElseThrow(() -> new EntityNotFoundException("SSA not found"));

        List<Long> correctIds = imageRepo.findBySsaOrderByCorrectPosition(ssa)
                .stream()
                .map(SequenceImageEntity::getImageID)
                .toList();

        boolean isCorrect = correctIds.equals(attemptedSequence);

        SSAAttemptEntity attempt = new SSAAttemptEntity(user, ssa, attemptedSequence, isCorrect);
        attemptRepo.save(attempt);

        return isCorrect;
    }
}
