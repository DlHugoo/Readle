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
                        "Focus on positive educational themes and avoid any inappropriate content." +
                        "Do not include any text, dialogue, or speech bubbles in the illustration.",
                storyContent.length() > 200 ? storyContent.substring(0, 200) + "..." : storyContent);
    }

    /**
     * Generate a book cover image based on book title, author, and content.
     * 
     * @param title       The book title
     * @param author      The book author
     * @param bookContent Aggregated content from all pages (truncated if too long)
     * @return Base64 encoded image string, or null if generation fails
     */
    public String generateBookCover(String title, String author, String bookContent) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // Create contextualized prompt for book cover
            String coverPrompt = createBookCoverPrompt(title, author, bookContent);

            // Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            // Prepare request body for book cover generation
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> instance = new HashMap<>();
            instance.put("prompt", coverPrompt);
            requestBody.put("instances", List.of(instance));

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("sampleCount", 1); // Only need one cover
            parameters.put("aspectRatio", "3:4"); // Book cover aspect ratio
            parameters.put("personGeneration", "allow_adult");
            requestBody.put("parameters", parameters);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Make API call to Google Imagen
            String url = "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict";
            System.out.println("Generating book cover: " + title);
            System.out.println("Request body: " + requestBody);

            var response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            // Log the response for debugging
            System.out.println("Book Cover API Response Status: " + response.getStatusCode());

            // Extract image from response
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("predictions")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> predictions = (List<Map<String, Object>>) responseBody.get("predictions");
                if (!predictions.isEmpty() && predictions.get(0).containsKey("bytesBase64Encoded")) {
                    return (String) predictions.get(0).get("bytesBase64Encoded");
                }
            }

            return null;

        } catch (Exception e) {
            System.err.println("Error in generateBookCover: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to generate book cover: " + e.getMessage(), e);
        }
    }

    private String createBookCoverPrompt(String title, String author, String bookContent) {
        // Limit content length to keep prompt manageable (use first 500 chars for
        // context)
        String contentSummary = bookContent != null && !bookContent.isEmpty()
                ? (bookContent.length() > 500 ? bookContent.substring(0, 500) + "..." : bookContent)
                : "educational children's story";

        String bookTitle = title != null ? title : "Book";
        String bookAuthor = author != null ? author : "Unknown";

        return String.format(
                "Professional book cover design for an educational children's book in 3:4 portrait aspect ratio. " +
                        "The book title is '%s' and the author is '%s'. " +
                        "Based on the story content: %s. " +
                        "Create a complete book cover with both illustration and text. " +
                        "The cover should be colorful, engaging, and child-friendly with vibrant colors suitable for elementary school children. "
                        +
                        "Design a captivating illustration that represents the main themes and characters of the story. "
                        +
                        "The illustration should be culturally appropriate and focus on positive educational themes. " +
                        "IMPORTANT: Display the title '%s' prominently at the top or center of the cover in large, readable, playful font that matches the children's book aesthetic. "
                        +
                        "Display the author name '%s' below the title or at the bottom in a clear, elegant font. " +
                        "The text should be clearly visible against the background with good contrast. " +
                        "Use creative typography that is fun and appealing to children while remaining professional and readable. "
                        +
                        "The overall design should look like a real published children's book cover with balanced composition of illustration and text.",
                bookTitle,
                bookAuthor,
                contentSummary,
                bookTitle,
                bookAuthor);
    }
}