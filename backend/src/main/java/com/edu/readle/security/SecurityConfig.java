package com.edu.readle.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.edu.readle.service.CustomUserDetailsService;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomUserDetailsService customUserDetailsService;

    public SecurityConfig(JwtFilter jwtFilter, CustomUserDetailsService customUserDetailsService) {
        this.jwtFilter = jwtFilter;
        this.customUserDetailsService = customUserDetailsService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf().disable()
            .authorizeHttpRequests()
            // Allow public access to authentication and error endpoints
            .requestMatchers("/api/auth/**", "/error").permitAll()

            // Allow public access to books, pages, and other public endpoints
             .requestMatchers("/api/books/**", "/api/pages/**", "/uploads/**", "/api/snake-questions/**", "/api/stories/**").permitAll()
            .requestMatchers("/api/books/**").hasAnyAuthority("STUDENT", "TEACHER")
            // Allow authenticated access to join classrooms (students need to join classrooms)
            .requestMatchers("/api/classrooms/join").hasAuthority("STUDENT")  // Only allow students to join classrooms
            // Allow authenticated access to the classrooms of students
            .requestMatchers("/api/classrooms/student/**").hasAuthority("STUDENT")  // Students can access their classrooms
            // Protect all other requests, allowing access only to authenticated users

            .anyRequest().authenticated()
            .and()
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);  // Add the JWT filter before the UsernamePasswordAuthenticationFilter

        return http.build();
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
