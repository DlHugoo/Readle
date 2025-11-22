package com.edu.readle.controller;

import com.edu.readle.dto.SequenceCheckResponseDTO;
import com.edu.readle.dto.WordStorySequenceDTO;
import com.edu.readle.entity.*;
import com.edu.readle.repository.*;
import com.edu.readle.service.WordStorySequenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Comparator;

@RestController
@RequestMapping("/api/wssa")
@CrossOrigin(origins = {"http://localhost:5173", "https://readle-pi.vercel.app"}, allowCredentials = "true")
public class WordStorySequenceController {

    @Autowired
    private WordStorySequenceActivityRepository wssaRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private BookRepository bookRepo;

    @Autowired
    private WordStorySequenceService wordStorySequenceService;

    /**
     * 🔐 GET /api/wssa/by-book/{bookId} — Admin & Teacher & Student can view WSSA setup
     */
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER', 'STUDENT')")
    @GetMapping("/by-book/{bookId}")
    public ResponseEntity<?> getWSSAByBook(@PathVariable Long bookId) {
        Optional<WordStorySequenceActivityEntity> optionalWSSA = wssaRepo.findByBook_BookID(bookId);

        if (optionalWSSA.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        WordStorySequenceActivityEntity wssa = optionalWSSA.get();

        Map<String, Object> response = new HashMap<>();
        response.put("id", wssa.getWssaID());
        response.put("title", wssa.getTitle());

        List<Map<String, Object>> texts = wssa.getSequenceTexts().stream()
            .sorted(Comparator.comparingInt(SequenceTextEntity::getCorrectPosition))
            .map(text -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", text.getTextID());
                map.put("textContent", text.getTextContent());
                map.put("correctPosition", text.getCorrectPosition());
                return map;
            }).collect(Collectors.toList());

        response.put("texts", texts);

        return ResponseEntity.ok(response);
    }

    /**
     * 🔐 POST /api/wssa/{wssaId}/check — Only Students can submit answers
     */
    @PreAuthorize("hasAuthority('STUDENT')")
    @PostMapping("/{wssaId}/check")
    public ResponseEntity<?> submitAnswer(@PathVariable Long wssaId,
                                          @RequestBody Map<String, List<Long>> body,
                                          Principal principal) {
        List<Long> attempted = body.get("attemptedSequence");
        if (attempted == null || attempted.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "No sequence submitted"));
        }

        UserEntity user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        try {
            SequenceCheckResponseDTO response = 
                wordStorySequenceService.checkSequenceWithFeedback(wssaId, attempted, user);
            
            return ResponseEntity.ok(Map.of(
                "correct", response.isCorrect(),
                "feedback", response.getFeedback()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            // Fallback to simple check if feedback generation fails
            boolean isCorrect = wordStorySequenceService.checkSequence(wssaId, attempted, user);
            String fallbackFeedback = isCorrect 
                ? "Excellent work! You've arranged the story parts correctly."
                : "Good effort! Think about the order of events in the story.";
            
            return ResponseEntity.ok(Map.of(
                "correct", isCorrect,
                "feedback", fallbackFeedback
            ));
        }
    }

    /**
     * 🔐 POST /api/wssa/create — Only Admin & Teacher can create WSSA
     */
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @PostMapping("/create")
    public ResponseEntity<?> createWSSA(@RequestBody WordStorySequenceDTO dto) {
        try {
            if (dto.getBookId() == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Book ID is required"));
            }
            
            if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Title is required"));
            }
            
            if (dto.getTexts() == null || dto.getTexts().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "At least one text part is required"));
            }

            Optional<BookEntity> optionalBook = bookRepo.findById(dto.getBookId());
            if (optionalBook.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid book ID"));
            }

            WordStorySequenceActivityEntity wssa = new WordStorySequenceActivityEntity(
                dto.getTitle(), 
                optionalBook.get()
            );

            List<SequenceTextEntity> sequenceTexts = dto.getTexts().stream()
                .map(textDto -> new SequenceTextEntity(
                    textDto.getTextContent(), 
                    textDto.getCorrectPosition(), 
                    wssa
                ))
                .collect(Collectors.toList());

            wssa.setSequenceTexts(sequenceTexts);
            wssaRepo.save(wssa); // saves WSSA and cascade saves texts

            return ResponseEntity.ok(Map.of(
                "message", "WSSA created successfully", 
                "wssaId", wssa.getWssaID()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Internal server error",
                    "message", e.getMessage() != null ? e.getMessage() : "Failed to create WSSA"
                ));
        }
    }
}

