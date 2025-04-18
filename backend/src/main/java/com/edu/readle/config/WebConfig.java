package com.edu.readle.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Map the "uploads/" directory to be served as static resources
        registry.addResourceHandler("/uploads/**") // Add /** to match all files and subdirectories
                .addResourceLocations("file:uploads/"); // Ensure this points to the correct directory
    }
}