package com.edu.readle.controller;

import com.edu.readle.dto.StorySequencingDTO;
import com.edu.readle.entity.Story;
import com.edu.readle.entity.StoryImage;
import com.edu.readle.entity.UserAttempt;
import com.edu.readle.service.StorySequencingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stories")
@CrossOrigin(origins = "*") // Adjust according to your CORS policy
public class StorySequencingController {

    private final StorySequencingService storySequencingService;

    @Autowired
    public StorySequencingController(StorySequencingService storySequencingService) {
        this.storySequencingService = storySequencingService;
    }

    @GetMapping
    public ResponseEntity<List<StorySequencingDTO>> getAllStories() {
        List<Story> stories = storySequencingService.getAllStories();
        List<StorySequencingDTO> storyDTOs = stories.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(storyDTOs);
    }

    @GetMapping("/{storyId}")
    public ResponseEntity<StorySequencingDTO> getStoryById(@PathVariable Long storyId) {
        Optional<Story> storyOpt = storySequencingService.getStoryById(storyId);
        if (storyOpt.isPresent()) {
            StorySequencingDTO dto = convertToDTO(storyOpt.get());
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<StorySequencingDTO> createStory(@RequestBody StorySequencingDTO storyDTO) {
        Story story = new Story(storyDTO.getTitle(), storyDTO.getCorrectSequence());
        Story savedStory = storySequencingService.createStory(story);
        
        // Add images if provided
        if (storyDTO.getImages() != null) {
            for (StorySequencingDTO.StoryImageDTO imageDTO : storyDTO.getImages()) {
                StoryImage image = new StoryImage(
                    imageDTO.getImageURL(), 
                    imageDTO.getSequenceNumber(), 
                    savedStory
                );
                storySequencingService.addImageToStory(savedStory.getStoryId(), image);
            }
        }
        
        // Refresh the story to get the updated images
        Optional<Story> refreshedStory = storySequencingService.getStoryById(savedStory.getStoryId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(convertToDTO(refreshedStory.orElse(savedStory)));
    }

    @PostMapping("/{storyId}/validate")
    public ResponseEntity<?> validateSequence(
            @PathVariable Long storyId,
            @RequestParam Long userId,
            @RequestParam String submittedSequence) {
        
        boolean isCorrect = storySequencingService.validateSequence(userId, storyId, submittedSequence);
        Optional<UserAttempt> attemptOpt = storySequencingService.getUserAttempt(userId, storyId);
        
        if (attemptOpt.isPresent()) {
            UserAttempt attempt = attemptOpt.get();
            return ResponseEntity.ok(
                    new ValidationResponseDTO(
                            isCorrect, 
                            attempt.getAttemptsRemaining(), 
                            isCorrect ? storySequencingService.getCorrectSequence(storyId) : null
                    )
            );
        }
        
        return ResponseEntity.badRequest().body("Failed to validate sequence");
    }

    @GetMapping("/{storyId}/images")
    public ResponseEntity<List<StorySequencingDTO.StoryImageDTO>> getStoryImages(@PathVariable Long storyId) {
        List<StoryImage> images = storySequencingService.getStoryImages(storyId);
        if (images != null) {
            List<StorySequencingDTO.StoryImageDTO> imageDTOs = images.stream()
                    .map(this::convertToImageDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(imageDTOs);
        }
        return ResponseEntity.notFound().build();
    }

    // Helper method to convert Story entity to DTO
    private StorySequencingDTO convertToDTO(Story story) {
        StorySequencingDTO dto = new StorySequencingDTO();
        dto.setStoryId(story.getStoryId());
        dto.setTitle(story.getTitle());
        dto.setCorrectSequence(story.getCorrectSequence());
        
        if (story.getImages() != null) {
            List<StorySequencingDTO.StoryImageDTO> imageDTOs = story.getImages().stream()
                    .map(this::convertToImageDTO)
                    .collect(Collectors.toList());
            dto.setImages(imageDTOs);
        } else {
            dto.setImages(new ArrayList<>());
        }
        
        return dto;
    }

    // Helper method to convert StoryImage entity to DTO
    private StorySequencingDTO.StoryImageDTO convertToImageDTO(StoryImage image) {
        StorySequencingDTO.StoryImageDTO dto = new StorySequencingDTO.StoryImageDTO();
        dto.setImageId(image.getId());
        dto.setImageURL(image.getImageUrl());
        dto.setSequenceNumber(image.getSequence());
        return dto;
    }

    // Inner class for validation response
    private static class ValidationResponseDTO {
        private final boolean correct;
        private final int attemptsRemaining;
        private final String correctSequence;

        public ValidationResponseDTO(boolean correct, int attemptsRemaining, String correctSequence) {
            this.correct = correct;
            this.attemptsRemaining = attemptsRemaining;
            this.correctSequence = correctSequence;
        }

        public boolean isCorrect() {
            return correct;
        }

        public int getAttemptsRemaining() {
            return attemptsRemaining;
        }

        public String getCorrectSequence() {
            return correctSequence;
        }
    }
}