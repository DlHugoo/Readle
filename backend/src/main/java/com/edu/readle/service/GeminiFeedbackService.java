package com.edu.readle.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class GeminiFeedbackService {

    @Value("${google.ai.api.key}")
    private String apiKey;

    /**
     * Generate contextual feedback for student's story sequencing attempt
     * 
     * @param correctSequence   List of text parts in correct chronological order
     * @param attemptedSequence List of text parts as attempted by student
     * @param bookTitle         Optional book title for context
     * @return Feedback message without revealing the correct answer
     */
    public String generateFeedback(List<String> correctSequence, List<String> attemptedSequence, String bookTitle) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            // Build the prompt for Gemini
            String prompt = buildFeedbackPrompt(correctSequence, attemptedSequence, bookTitle);

            // Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey); // API key as header per Gemini API docs

            // Prepare request body for Gemini API
            Map<String, Object> requestBody = new HashMap<>();

            // Content structure for Gemini
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(Map.of("text", prompt)));

            Map<String, Object> contentItem = new HashMap<>();
            contentItem.put("role", "user");
            contentItem.put("parts", List.of(Map.of("text", prompt)));

            requestBody.put("contents", List.of(contentItem));

            // Generation config
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("topK", 40);
            generationConfig.put("topP", 0.95);
            generationConfig.put("maxOutputTokens", 200);
            generationConfig.put("stopSequences", List.of());
            requestBody.put("generationConfig", generationConfig);

            // Safety settings
            List<Map<String, Object>> safetySettings = List.of(
                    Map.of("category", "HARM_CATEGORY_HARASSMENT", "threshold", "BLOCK_MEDIUM_AND_ABOVE"),
                    Map.of("category", "HARM_CATEGORY_HATE_SPEECH", "threshold", "BLOCK_MEDIUM_AND_ABOVE"),
                    Map.of("category", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold", "BLOCK_MEDIUM_AND_ABOVE"),
                    Map.of("category", "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold", "BLOCK_MEDIUM_AND_ABOVE"));
            requestBody.put("safetySettings", safetySettings);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Make API call to Gemini - Updated to use gemini-2.5-flash (correct model
            // name)
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

            var response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            // Extract feedback from response
            @SuppressWarnings("unchecked")
            Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
            
            // Debug logging to see actual response structure
            System.out.println("Gemini API Response: " + responseBody);
            
            if (responseBody != null) {
                // Try to extract feedback from response
                String feedbackText = extractFeedbackFromResponse(responseBody);
                if (feedbackText != null && !feedbackText.trim().isEmpty()) {
                    return feedbackText;
                }
            }

            // Fallback if parsing fails
            System.err.println("Failed to extract feedback from response. Response structure: " + responseBody);
            return "Good effort! Think about the order of events in the story. What happens first, and what comes next?";

        } catch (Exception e) {
            System.err.println("Error generating Gemini feedback: " + e.getMessage());
            e.printStackTrace();
            // Return a helpful fallback message
            return "Good effort! Think about the order of events in the story. What happens first, and what comes next?";
        }
    }

    /**
     * Build the prompt for Gemini to analyze the sequence
     */
    private String buildFeedbackPrompt(List<String> correctSequence, List<String> attemptedSequence, String bookTitle) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an educational assistant helping elementary students learn story sequencing.\n\n");

        if (bookTitle != null && !bookTitle.isEmpty()) {
            prompt.append("Story Title: ").append(bookTitle).append("\n\n");
        }

        prompt.append("CORRECT STORY SEQUENCE (in chronological order):\n");
        for (int i = 0; i < correctSequence.size(); i++) {
            prompt.append(String.format("%d. %s\n", i + 1, correctSequence.get(i)));
        }

        prompt.append("\nSTUDENT'S ATTEMPTED SEQUENCE:\n");
        for (int i = 0; i < attemptedSequence.size(); i++) {
            prompt.append(String.format("%d. %s\n", i + 1, attemptedSequence.get(i)));
        }

        prompt.append("\nTASK:\n");
        prompt.append("1. Compare the student's sequence with the correct sequence.\n");
        prompt.append("2. If the sequences match, provide encouraging feedback celebrating their success.\n");
        prompt.append("3. If the sequences do NOT match, provide helpful feedback that:\n");
        prompt.append("   - Points out what might be wrong (e.g., 'Think about what happens first in the story')\n");
        prompt.append("   - Gives hints about chronological order and cause-and-effect relationships\n");
        prompt.append("   - Encourages the student to think about the story flow\n");
        prompt.append("   - Does NOT reveal the correct answer or correct order\n");
        prompt.append("   - Is encouraging and supportive (2-3 sentences maximum)\n");
        prompt.append("   - Uses simple language appropriate for elementary students\n");
        prompt.append("\n");
        prompt.append("Provide your feedback now (2-3 sentences, encouraging and helpful):");

        return prompt.toString();
    }

    /**
     * Extract feedback text from Gemini API response
     */
    private String extractFeedbackFromResponse(Map<String, Object> responseBody) {
        try {
            // Try standard structure: responseBody -> candidates -> content -> parts -> text
            if (responseBody.containsKey("candidates")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    if (candidate.containsKey("content")) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> contentMap = (Map<String, Object>) candidate.get("content");
                        if (contentMap != null && contentMap.containsKey("parts")) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> parts = (List<Map<String, Object>>) contentMap.get("parts");
                            if (parts != null && !parts.isEmpty()) {
                                Map<String, Object> firstPart = parts.get(0);
                                if (firstPart.containsKey("text")) {
                                    return (String) firstPart.get("text");
                                }
                            }
                        }
                    }
                }
            }
            
            // Alternative: Check if response has direct text field
            if (responseBody.containsKey("text")) {
                return (String) responseBody.get("text");
            }
            
            return null;
        } catch (Exception e) {
            System.err.println("Error extracting feedback: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}
