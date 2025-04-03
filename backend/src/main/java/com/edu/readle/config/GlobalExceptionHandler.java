package com.edu.readle.config;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleException(Exception ex) {
        ex.printStackTrace(); // Log the full error
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                             .body("Error: " + ex.getMessage());
    }
}
