package com.edu.readle.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class ImagenService {

    @Value("${google.ai.api.key}")
    private String apiKey;

    public List<String> generateEducationalImages(String prompt, int numberOfImages) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // Create educational prompt with safety settings
            String educationalPrompt = createEducationalPrompt(prompt);

            // Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            // Prepare request body according to Google Imagen API format
            // Based on the documentation, the format should be:
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> instance = new HashMap<>();
            instance.put("prompt", educationalPrompt);
            requestBody.put("instances", List.of(instance));

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("sampleCount", numberOfImages);
            parameters.put("aspectRatio", "1:1");
            parameters.put("personGeneration", "allow_adult");
            requestBody.put("parameters", parameters);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Make API call to Google Imagen using the correct endpoint
            // Try the newer Imagen 4 API first
            String url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict";
            System.out.println("Making request to: " + url);
            System.out.println("Request body: " + requestBody);

            var response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            // Log the response for debugging
            System.out.println("API Response Status: " + response.getStatusCode());
            System.out.println("API Response Body: " + response.getBody());

            // Extract images from response
            List<String> imageDataList = new ArrayList<>();
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("predictions")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> predictions = (List<Map<String, Object>>) responseBody.get("predictions");
                for (Map<String, Object> prediction : predictions) {
                    if (prediction.containsKey("bytesBase64Encoded")) {
                        imageDataList.add((String) prediction.get("bytesBase64Encoded"));
                    }
                }
            }

            return imageDataList;

        } catch (Exception e) {
            System.err.println("Error in generateEducationalImages: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate images: " + e.getMessage(), e);
        }
    }

    public List<String> generateBookPageImages(String storyContent, int numberOfImages) {
        try {
            // Create a more specific prompt based on story content
            String prompt = createBookPagePrompt(storyContent);
            return generateEducationalImages(prompt, numberOfImages);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate book page images: " + e.getMessage(), e);
        }
    }

    private String createEducationalPrompt(String userPrompt) {
        return String.format(
                "Educational illustration for elementary students: %s. " +
                        "Child-friendly, colorful, engaging, culturally appropriate. " +
                        "Simple composition, clear visual elements, suitable for reading comprehension. " +
                        "Avoid any inappropriate content, focus on positive educational themes.",
                userPrompt);
    }

    private String createBookPagePrompt(String storyContent) {
        return String.format(
                "Educational book illustration based on story content: %s. " +
                        "Child-friendly, colorful, engaging illustration that helps with reading comprehension. " +
                        "Simple composition, clear visual elements, culturally appropriate for elementary students. " +
                        "Focus on positive educational themes and avoid any inappropriate content.",
                storyContent.length() > 200 ? storyContent.substring(0, 200) + "..." : storyContent);
    }
}