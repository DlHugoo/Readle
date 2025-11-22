package com.edu.readle.controller;

import com.edu.readle.dto.WordStorySequenceDTO;
import com.edu.readle.entity.*;
import com.edu.readle.repository.*;
import com.edu.readle.service.WordStorySequenceService;
import org.springframework.beans.factory.annotation.Autowired;
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
            return ResponseEntity.badRequest().body("No sequence submitted");
        }

        UserEntity user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isCorrect = wordStorySequenceService.checkSequence(wssaId, attempted, user);
        return ResponseEntity.ok(Map.of("correct", isCorrect));
    }

    /**
     * 🔐 POST /api/wssa/create — Only Admin & Teacher can create WSSA
     */
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @PostMapping("/create")
    public ResponseEntity<?> createWSSA(@RequestBody WordStorySequenceDTO dto) {
        Optional<BookEntity> optionalBook = bookRepo.findById(dto.getBookId());
        if (optionalBook.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid book ID");
        }

        WordStorySequenceActivityEntity wssa = new WordStorySequenceActivityEntity(dto.getTitle(), optionalBook.get());

        List<SequenceTextEntity> sequenceTexts = dto.getTexts().stream().map(textDto ->
            new SequenceTextEntity(textDto.getTextContent(), textDto.getCorrectPosition(), wssa)
        ).collect(Collectors.toList());

        wssa.setSequenceTexts(sequenceTexts);
        wssaRepo.save(wssa); // saves WSSA and cascade saves texts

        return ResponseEntity.ok(Map.of("message", "WSSA created successfully", "wssaId", wssa.getWssaID()));
    }
}

