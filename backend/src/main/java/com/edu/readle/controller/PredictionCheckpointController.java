package com.edu.readle.controller;

import com.edu.readle.dto.PredictionCheckpointDTO;
import com.edu.readle.dto.UpdatePredictionPositionsDTO;
import com.edu.readle.entity.PredictionCheckpointEntity;
import com.edu.readle.service.PredictionCheckpointService;

import jakarta.persistence.EntityNotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/prediction-checkpoints")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PredictionCheckpointController {

    @Autowired
    private PredictionCheckpointService checkpointService;

    @GetMapping("/by-book/{bookId}")
    public ResponseEntity<?> getCheckpointByBook(@PathVariable("bookId") Long bookId) {
        try {
            PredictionCheckpointEntity checkpoint = checkpointService.getActivityByBookId(bookId);

            Map<String, Object> response = new HashMap<>();
            response.put("id", checkpoint.getCheckpointId());
            response.put("title", checkpoint.getTitle());
            response.put("pageNumber", checkpoint.getPageNumber());

            // Sequence images to display in order
            List<Map<String, Object>> sequenceImages = checkpoint.getSequenceImages().stream()
                    .sorted(Comparator.comparingInt(img -> img.getCorrectPosition()))
                    .map(img -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", img.getImageID());
                        map.put("imageUrl", img.getImageURL());
                        map.put("position", img.getCorrectPosition());
                        return map;
                    }).toList();

            // Prediction options
            List<Map<String, Object>> predictionOptions = checkpoint.getPredictionImages().stream()
                    .sorted((a, b) -> Boolean.compare(b.isCorrect(), a.isCorrect()))
                    .map(img -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", img.getImageId());
                        map.put("imageUrl", img.getImageURL());
                        map.put("isCorrect", img.isCorrect());
                        return map;
                    }).toList();

            response.put("sequenceImages", sequenceImages);
            response.put("options", predictionOptions);

            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.badRequest().body("No checkpoint found for book " + bookId);
        }
    }

    @PostMapping("/{checkpointId}/check")
    public ResponseEntity<?> submitPrediction(
            @PathVariable("checkpointId") Long checkpointId,
            @RequestBody Map<String, Long> body) {

        Long selectedImageId = body.get("selectedImageId");
        Long userId = body.get("userId"); // passed directly from frontend

        if (selectedImageId == null) {
            return ResponseEntity.badRequest().body("No prediction submitted");
        }

        boolean isCorrect = checkpointService.checkPrediction(checkpointId, selectedImageId, userId);

        return ResponseEntity.ok(Map.of("correct", isCorrect));
    }

    @GetMapping("/book/{bookId}/page/{pageNumber}")
    public ResponseEntity<List<PredictionCheckpointEntity>> getCheckpointsUpToPage(
            @PathVariable("bookId") Long bookId,
            @PathVariable("pageNumber") Integer pageNumber) {
        List<PredictionCheckpointEntity> checkpoints = checkpointService.getCheckpointsUpToPage(bookId, pageNumber);
        return ResponseEntity.ok(checkpoints);
    }

    @PostMapping
    public ResponseEntity<?> createCheckpoint(@RequestBody PredictionCheckpointDTO dto) {
        try {
            PredictionCheckpointEntity saved = checkpointService.createCheckpoint(dto);
            return ResponseEntity.ok(Map.of("checkpointId", saved.getCheckpointId()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to create checkpoint");
        }
    }

    @PutMapping("/update-positions/{checkpointId}")
    public ResponseEntity<?> updatePositions(
            @PathVariable("checkpointId") Long checkpointId,
            @RequestBody UpdatePredictionPositionsDTO dto
    ) {
        try {
            checkpointService.updateImagePositions(checkpointId, dto);
            return ResponseEntity.ok(Map.of("message", "Positions updated"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update positions");
        }
    }
}
