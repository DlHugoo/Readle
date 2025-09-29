package com.edu.readle.controller;

import com.edu.readle.service.ImagenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = {"http://localhost:5173", "https://readle-pi.vercel.app"})
@RequestMapping("/api/imagen")
public class ImagenController {

    @Autowired
    private ImagenService imagenService;

    // Generate images based on a text prompt
    @PostMapping("/generate")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    public ResponseEntity<?> generateImages(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("Received request: " + request);

            String prompt = (String) request.get("prompt");
            Integer numberOfImages = (Integer) request.getOrDefault("numberOfImages", 1);

            System.out.println("Prompt: " + prompt);
            System.out.println("Number of images: " + numberOfImages);

            if (prompt == null || prompt.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Prompt is required"));
            }

            if (numberOfImages < 1 || numberOfImages > 4) {
                return ResponseEntity.badRequest().body(Map.of("error", "Number of images must be between 1 and 4"));
            }

            List<String> generatedImages = imagenService.generateEducationalImages(prompt, numberOfImages);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "images", generatedImages,
                    "count", generatedImages.size()));

        } catch (Exception e) {
            System.err.println("Error in generateImages controller: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to generate images: " + e.getMessage()));
        }
    }

    // Generate images specifically for book pages
    @PostMapping("/generate-book-page")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TEACHER')")
    public ResponseEntity<?> generateBookPageImages(@RequestBody Map<String, Object> request) {
        try {
            String storyContent = (String) request.get("storyContent");
            Integer numberOfImages = (Integer) request.getOrDefault("numberOfImages", 1);

            if (storyContent == null || storyContent.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Story content is required"));
            }

            if (numberOfImages < 1 || numberOfImages > 4) {
                return ResponseEntity.badRequest().body(Map.of("error", "Number of images must be between 1 and 4"));
            }

            List<String> generatedImages = imagenService.generateBookPageImages(storyContent, numberOfImages);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "images", generatedImages,
                    "count", generatedImages.size()));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to generate book page images: " + e.getMessage()));
        }
    }
}
