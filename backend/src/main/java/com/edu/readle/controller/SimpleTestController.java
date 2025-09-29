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
@CrossOrigin(origins = {"http://localhost:5173", "https://readle-pi.vercel.app"})
@RequestMapping("/api/simple-test")
public class SimpleTestController {

    @Value("${google.ai.api.key}")
    private String apiKey;

    @GetMapping("/test-key")
    public ResponseEntity<?> testApiKey() {
        try {
            System.out.println("API Key (first 10 chars): " + apiKey.substring(0, 10) + "...");

            // Test with a very simple request to see if the API key works
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            // Very simple test request
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> instance = new HashMap<>();
            instance.put("prompt", "A simple test");
            requestBody.put("instances", List.of(instance));

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("sampleCount", 1);
            requestBody.put("parameters", parameters);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Try with Imagen 3 first
            String url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict";
            System.out.println("Testing with URL: " + url);

            try {
                var response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
                System.out.println("Response Status: " + response.getStatusCode());
                System.out.println("Response Body: " + response.getBody());

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "status", response.getStatusCode().toString(),
                        "message", "API call successful"));
            } catch (Exception e) {
                System.err.println("Error with Imagen 3: " + e.getMessage());

                // Try with Imagen 4
                url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict";
                System.out.println("Trying with URL: " + url);

                try {
                    var response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
                    System.out.println("Response Status: " + response.getStatusCode());
                    System.out.println("Response Body: " + response.getBody());

                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "status", response.getStatusCode().toString(),
                            "message", "API call successful with Imagen 4"));
                } catch (Exception e2) {
                    System.err.println("Error with Imagen 4: " + e2.getMessage());
                    return ResponseEntity.status(500).body(Map.of(
                            "error", "Both API calls failed",
                            "imagen3_error", e.getMessage(),
                            "imagen4_error", e2.getMessage()));
                }
            }

        } catch (Exception e) {
            System.err.println("General error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Test failed: " + e.getMessage()));
        }
    }
}
