package com.edu.readle.service;

import com.edu.readle.dto.PredictionCheckpointDTO;
import com.edu.readle.dto.UpdatePredictionPositionsDTO;
import com.edu.readle.entity.PredictionCheckpointEntity;
import com.edu.readle.entity.PredictionImageEntity;
import com.edu.readle.entity.SequenceImageEntity;
import com.edu.readle.repository.PredictionCheckpointRepository;
import com.edu.readle.repository.BookRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PredictionCheckpointService {

    @Autowired
    private PredictionCheckpointRepository checkpointRepository;

    @Autowired
    private BookRepository bookRepository;

    public PredictionCheckpointEntity getActivityByBookId(Long bookId) {
        return checkpointRepository.findByBook_BookID(bookId)
                .orElseThrow(() -> new EntityNotFoundException("Prediction Checkpoint not found for book " + bookId));
    }

    public boolean checkPrediction(Long checkpointId, Long selectedImageId, Long userId) {
        PredictionCheckpointEntity checkpoint = checkpointRepository.findById(checkpointId)
                .orElseThrow(() -> new EntityNotFoundException("Checkpoint not found"));

        boolean isValid = checkpoint.getPredictionImages().stream()
                .anyMatch(img -> img.getImageId().equals(selectedImageId));

        if (!isValid) {
            throw new IllegalArgumentException("Invalid prediction option submitted.");
        }

        return checkpoint.getPredictionImages().stream()
                .filter(img -> img.getImageId().equals(selectedImageId))
                .findFirst()
                .map(PredictionImageEntity::isCorrect)
                .orElse(false);
    }

    public List<PredictionCheckpointEntity> getCheckpointsUpToPage(Long bookId, Integer pageNumber) {
        return checkpointRepository.findByBook_BookIDAndPageNumberLessThanEqual(bookId, pageNumber);
    }

    public PredictionCheckpointEntity createCheckpoint(PredictionCheckpointDTO dto) {
        PredictionCheckpointEntity checkpoint = new PredictionCheckpointEntity();
        checkpoint.setTitle(dto.getTitle());
        checkpoint.setPageNumber(dto.getPageNumber());
        checkpoint.setBook(bookRepository.findById(dto.getBookId())
                .orElseThrow(() -> new EntityNotFoundException("Book not found")));

        // Prediction options
        List<PredictionImageEntity> predictionOptions = dto.getPredictionOptions().stream().map(optDto -> {
            PredictionImageEntity opt = new PredictionImageEntity();
            opt.setImageURL(optDto.getImageUrl());
            opt.setCorrect(Boolean.TRUE.equals(optDto.getIsCorrect()));
            opt.setCheckpoint(checkpoint);
            return opt;
        }).toList();
        checkpoint.setPredictionImages(predictionOptions);

        // Sequence images
        List<SequenceImageEntity> sequenceImages = dto.getSequenceImages().stream().map(seqDto -> {
            SequenceImageEntity seq = new SequenceImageEntity();
            seq.setImageURL(seqDto.getImageUrl());
            seq.setCorrectPosition(seqDto.getPosition());
            seq.setCheckpoint(checkpoint);
            seq.setSsa(null); // Important: only one parent
            return seq;
        }).toList();
        checkpoint.setSequenceImages(sequenceImages);

        return checkpointRepository.save(checkpoint);
    }

    @Transactional
    public void updateImagePositions(Long checkpointId, UpdatePredictionPositionsDTO dto) {
        PredictionCheckpointEntity checkpoint = checkpointRepository.findById(checkpointId)
                .orElseThrow(() -> new EntityNotFoundException("Checkpoint not found"));

        if (dto.getStoryImages() != null && !dto.getStoryImages().isEmpty()) {
            Map<Long, Integer> positionMap = dto.getStoryImages().stream()
                    .collect(Collectors.toMap(UpdatePredictionPositionsDTO.StoryImageUpdate::getId,
                            UpdatePredictionPositionsDTO.StoryImageUpdate::getPosition));

            for (SequenceImageEntity seq : checkpoint.getSequenceImages()) {
                Integer newPos = positionMap.get(seq.getImageID());
                if (newPos != null) {
                    seq.setCorrectPosition(newPos);
                }
            }
        }

        if (dto.getOptionImages() != null && !dto.getOptionImages().isEmpty()) {
            Map<Long, Boolean> correctMap = dto.getOptionImages().stream()
                    .collect(Collectors.toMap(UpdatePredictionPositionsDTO.OptionImageUpdate::getId,
                            oi -> Boolean.TRUE.equals(oi.getIsCorrect())));

            for (PredictionImageEntity opt : checkpoint.getPredictionImages()) {
                Boolean isCorrect = correctMap.get(opt.getImageId());
                if (isCorrect != null) {
                    opt.setCorrect(isCorrect);
                }
            }

            // Optional: ensure only one correct. If multiple true, keep as provided.
            // If none provided as true, do nothing here.
        }

        checkpointRepository.save(checkpoint);
    }

}