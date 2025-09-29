package com.edu.readle.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

import java.util.Map;
import java.util.HashMap;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/test-imagen")
public class TestImagenController {

    @Value("${google.ai.api.key}")
    private String apiKey;

    @PostMapping("/test")
    public ResponseEntity<?> testImagenAPI(@RequestBody Map<String, Object> request) {
        try {
            System.out.println("Testing Imagen API with key: " + apiKey.substring(0, 10) + "...");

            RestTemplate restTemplate = new RestTemplate();

            // Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            // Simple test request
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> instance = new HashMap<>();
            instance.put("prompt", "A simple test image");
            requestBody.put("instances", List.of(instance));

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("sampleCount", 1);
            requestBody.put("parameters", parameters);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Test with a simple prompt
            String url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict";
            System.out.println("Making request to: " + url);
            System.out.println("Request body: " + requestBody);

            var response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            System.out.println("Response status: " + response.getStatusCode());
            System.out.println("Response body: " + response.getBody());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "status", response.getStatusCode().toString(),
                    "body", response.getBody()));

        } catch (Exception e) {
            System.err.println("Error in test: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Test failed: " + e.getMessage(),
                    "apiKey", apiKey.substring(0, 10) + "..."));
        }
    }
}
