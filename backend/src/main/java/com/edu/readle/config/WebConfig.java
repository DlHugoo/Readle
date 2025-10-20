package com.edu.readle.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Serving static files
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }

    // CORS is now configured in SecurityConfig.corsConfigurationSource

    // RestTemplate bean for making external API calls
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

}
