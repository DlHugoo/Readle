package com.edu.readle.controller;

import com.edu.readle.entity.*;
import com.edu.readle.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ssa")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class StorySequenceActivityController {

    @Autowired
    private StorySequenceActivityRepository ssaRepo;

    @Autowired
    private SequenceImageRepository imageRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private SSAAttemptRepository attemptRepo;

    /**
     * GET /api/ssa/by-book/{bookId}
     */
    @GetMapping("/by-book/{bookId}")
    public ResponseEntity<?> getSSAByBook(@PathVariable Long bookId) {
        Optional<StorySequenceActivityEntity> optionalSSA = ssaRepo.findByBook_BookID(bookId);

        if (optionalSSA.isEmpty()) {
            return ResponseEntity.badRequest().body("No SSA found for book " + bookId);
        }

        StorySequenceActivityEntity ssa = optionalSSA.get();

        Map<String, Object> response = new HashMap<>();
        response.put("id", ssa.getSsaID());
        response.put("title", ssa.getTitle());

        List<Map<String, Object>> images = ssa.getSequenceImages().stream().map(img -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", img.getImageID());
            map.put("imageUrl", img.getImageURL());
            return map;
        }).collect(Collectors.toList());

        response.put("images", images);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/ssa/{ssaId}/check
     */
    @PostMapping("/{ssaId}/check")
    public ResponseEntity<?> submitAnswer(@PathVariable Long ssaId,
            @RequestBody Map<String, List<Long>> body,
            Principal principal) {

        List<Long> attempted = body.get("attemptedSequence");
        if (attempted == null || attempted.isEmpty()) {
            return ResponseEntity.badRequest().body("No sequence submitted");
        }

        Optional<StorySequenceActivityEntity> optionalSSA = ssaRepo.findById(ssaId);
        if (optionalSSA.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid SSA ID");
        }

        StorySequenceActivityEntity ssa = optionalSSA.get();

        List<Long> correct = ssa.getSequenceImages().stream()
                .sorted(Comparator.comparingInt(SequenceImageEntity::getCorrectPosition))
                .map(SequenceImageEntity::getImageID)
                .toList();

        boolean isCorrect = attempted.equals(correct);

        // Save attempt if user is authenticated
        UserEntity user = userRepo.findByEmail(principal.getName()).orElse(null);
        if (user != null) {
            SSAAttemptEntity attempt = new SSAAttemptEntity(user, ssa, attempted, isCorrect);
            attemptRepo.save(attempt);
        }

        return ResponseEntity.ok(Map.of("correct", isCorrect));
    }
}
