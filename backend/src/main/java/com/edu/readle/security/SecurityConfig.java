package com.edu.readle.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
        http
            .cors()
            .and()
            .csrf().disable()
            .authorizeHttpRequests()

            // ✅ Allow public access to authentication & error endpoints
            .requestMatchers("/api/auth/**", "/error").permitAll()

            // ✅ Allow admin/teacher registration if needed
            .requestMatchers(HttpMethod.POST, "/api/users").permitAll()

            // ✅ Allow public access to read books and resources
            .requestMatchers(HttpMethod.GET, "/api/books/**").permitAll()
            .requestMatchers("/api/pages/**", "/uploads/**", "/api/snake-questions/**",
                             "/api/stories/**", "/api/ssa/**", "/api/snake-attempts/**").permitAll()

            // ✅ Classroom-specific access control
            .requestMatchers("/api/classrooms/join").hasAuthority("STUDENT")
            .requestMatchers("/api/classrooms/student/**").hasAuthority("STUDENT")

            // ✅ Book creation (standard teacher/admin book)
            .requestMatchers(HttpMethod.POST, "/api/books").hasAnyAuthority("ADMIN", "TEACHER")

            // ✅ 🔐 Add admin-only book creation/update endpoints
            .requestMatchers("/api/books/admin/**").hasAuthority("ADMIN")

            // ✅ 🔐 Secure image upload for admins and teachers
            .requestMatchers(HttpMethod.POST, "/api/books/upload-image").hasAnyAuthority("ADMIN", "TEACHER")

            // ✅ All other requests must be authenticated
            .anyRequest().authenticated()
            .and()

            // ✅ Plug in JWT filter BEFORE Spring's login filter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

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
