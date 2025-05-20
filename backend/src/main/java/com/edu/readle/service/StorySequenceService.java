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
import com.edu.readle.dto.StorySequenceProgressDTO;
import java.util.ArrayList;

@Service
public class StorySequenceService {

    @Autowired
    private StorySequenceActivityRepository ssaRepo;

    @Autowired
    private SequenceImageRepository imageRepo;

    @Autowired
    private SSAAttemptService ssaAttemptService;

    @Autowired
    private SSAAttemptRepository attemptRepo;  // Add this field

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

        ssaAttemptService.saveAttempt(user, ssa, attemptedSequence, isCorrect);

        return isCorrect;
    }

    public List<StorySequenceProgressDTO> getStudentSSAProgress(Long userId) {
        List<StorySequenceActivityEntity> allActivities = ssaRepo.findAll();
        List<StorySequenceProgressDTO> progressList = new ArrayList<>();

        for (StorySequenceActivityEntity activity : allActivities) {
            boolean finished = attemptRepo
                .findTopByUser_UserIdAndSsa_SsaIDOrderByAttemptedAtDesc(userId, activity.getSsaID())
                .map(SSAAttemptEntity::isCorrect)
                .orElse(false);
            progressList.add(new StorySequenceProgressDTO(activity.getSsaID(), activity.getTitle(), finished));
        }
        return progressList;
    }
}
