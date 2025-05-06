package com.edu.readle.service;

import com.edu.readle.entity.Story;
import com.edu.readle.entity.StoryImage;
import com.edu.readle.entity.UserAttempt;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.StoryImageRepository;
import com.edu.readle.repository.StoryRepository;
import com.edu.readle.repository.UserAttemptRepository;
import com.edu.readle.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StorySequencingService {

    private final StoryRepository storyRepository;
    private final StoryImageRepository storyImageRepository;
    private final UserAttemptRepository userAttemptRepository;
    private final UserRepository userRepository;

    // Maximum number of attempts allowed per story
    private static final int MAX_ATTEMPTS = 3;

    public StorySequencingService(StoryRepository storyRepository, 
                                 StoryImageRepository storyImageRepository,
                                 UserAttemptRepository userAttemptRepository,
                                 UserRepository userRepository) {
        this.storyRepository = storyRepository;
        this.storyImageRepository = storyImageRepository;
        this.userAttemptRepository = userAttemptRepository;
        this.userRepository = userRepository;
    }

    // Get all stories
    public List<Story> getAllStories() {
        return storyRepository.findAll();
    }

    // Get a story by ID
    public Optional<Story> getStoryById(Long storyId) {
        return storyRepository.findById(storyId);
    }

    // Get images for a story
    public List<StoryImage> getStoryImages(Long storyId) {
        Optional<Story> story = storyRepository.findById(storyId);
        return story.map(storyImageRepository::findByStoryOrderBySequence).orElse(null);
    }

    // Validate a user's sequence submission
    public boolean validateSequence(Long userId, Long storyId, String submittedSequence) {
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        Optional<Story> storyOpt = storyRepository.findById(storyId);
        
        if (userOpt.isEmpty() || storyOpt.isEmpty()) {
            return false;
        }
        
        UserEntity user = userOpt.get();
        Story story = storyOpt.get();
        
        // Get or create user attempt
        UserAttempt attempt = userAttemptRepository.findByUserAndStory(user, story)
                .orElse(new UserAttempt(user, story, "", MAX_ATTEMPTS, false));
        
        // Check if user has attempts remaining
        if (attempt.getAttemptsRemaining() <= 0) {
            return false;
        }
        
        // Compare submitted sequence with correct sequence
        boolean isCorrect = submittedSequence.equals(story.getCorrectSequence());
        
        // Update attempt
        attempt.setSubmittedSequence(submittedSequence);
        attempt.setCorrect(isCorrect);
        attempt.saveAttempt();
        
        // Save the attempt
        userAttemptRepository.save(attempt);
        
        return isCorrect;
    }

    // Get the correct sequence for a story
    public String getCorrectSequence(Long storyId) {
        Optional<Story> story = storyRepository.findById(storyId);
        return story.map(Story::getCorrectSequence).orElse(null);
    }

    // Create a new story
    public Story createStory(Story story) {
        return storyRepository.save(story);
    }

    // Add an image to a story
    public StoryImage addImageToStory(Long storyId, StoryImage image) {
        Optional<Story> storyOpt = storyRepository.findById(storyId);
        if (storyOpt.isPresent()) {
            Story story = storyOpt.get();
            image.setStory(story);
            return storyImageRepository.save(image);
        }
        return null;
    }

    // Get user attempts for a story
    public Optional<UserAttempt> getUserAttempt(Long userId, Long storyId) {
        Optional<UserEntity> userOpt = userRepository.findById(userId);
        Optional<Story> storyOpt = storyRepository.findById(storyId);
        
        if (userOpt.isPresent() && storyOpt.isPresent()) {
            return userAttemptRepository.findByUserAndStory(userOpt.get(), storyOpt.get());
        }
        
        return Optional.empty();
    }
}