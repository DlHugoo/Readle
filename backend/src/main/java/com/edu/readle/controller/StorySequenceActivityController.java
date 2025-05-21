package com.edu.readle.controller;

import com.edu.readle.dto.StorySequenceDTO;
import com.edu.readle.dto.StorySequenceDTO.ImageDTO;
import com.edu.readle.entity.*;
import com.edu.readle.repository.*;
import com.edu.readle.dto.StorySequenceProgressDTO;
import com.edu.readle.service.StorySequenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private BookRepository bookRepo;

    @Autowired
    private StorySequenceService storySequenceService;

    /**
     * 🔐 GET /api/ssa/by-book/{bookId} — Admin & Teacher can view SSA setup
     */
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER', 'STUDENT')")
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
     * 🔐 POST /api/ssa/{ssaId}/check — Only Students can submit answers
     */
    @PreAuthorize("hasAuthority('STUDENT')")
    @PostMapping("/{ssaId}/check")
    public ResponseEntity<?> submitAnswer(@PathVariable Long ssaId,
                                          @RequestBody Map<String, List<Long>> body,
                                          Principal principal) {
        List<Long> attempted = body.get("attemptedSequence");
        if (attempted == null || attempted.isEmpty()) {
            return ResponseEntity.badRequest().body("No sequence submitted");
        }

        UserEntity user = userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isCorrect = storySequenceService.checkSequence(ssaId, attempted, user);
        return ResponseEntity.ok(Map.of("correct", isCorrect));
    }

    /**
     * 🔐 POST /api/ssa/create — Only Admin & Teacher can create SSA
     */
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    @PostMapping("/create")
    public ResponseEntity<?> createSSA(@RequestBody StorySequenceDTO dto) {
        Optional<BookEntity> optionalBook = bookRepo.findById(dto.getBookId());
        if (optionalBook.isEmpty()) {
            return ResponseEntity.badRequest().body("Invalid book ID");
        }

        StorySequenceActivityEntity ssa = new StorySequenceActivityEntity(dto.getTitle(), optionalBook.get());

        List<SequenceImageEntity> sequenceImages = dto.getImages().stream().map(imgDto ->
            new SequenceImageEntity(imgDto.getImageUrl(), imgDto.getCorrectPosition(), ssa)
        ).collect(Collectors.toList());

        ssa.setSequenceImages(sequenceImages);
        ssaRepo.save(ssa); // saves SSA and cascade saves images

        return ResponseEntity.ok(Map.of("message", "SSA created successfully", "ssaId", ssa.getSsaID()));
    }

    /**
     * 🔐 GET /api/ssa/progress/{userId} — Only Students can view their progress
     */
    @PreAuthorize("hasAuthority('STUDENT')")
    @GetMapping("/progress/{userId}")
    public ResponseEntity<List<StorySequenceProgressDTO>> getStudentSSAProgress(@PathVariable Long userId) {
        List<StorySequenceProgressDTO> progress = storySequenceService.getStudentSSAProgress(userId);
        return ResponseEntity.ok(progress);
    }
}
