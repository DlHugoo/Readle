package com.edu.readle.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            OAuth2SuccessHandler oauth2SuccessHandler,
            OAuth2FailureHandler oauth2FailureHandler
    ) throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource(null)))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(auth -> auth
                // Always allow CORS preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Static / FE assets
                .requestMatchers("/", "/index.html", "/favicon.ico", "/assets/**").permitAll()

                // OAuth flow + FE landing routes
                .requestMatchers("/oauth2/**", "/auth/**", "/authCallback").permitAll()

                // Error/health
                .requestMatchers("/error", "/actuator/health").permitAll()

                // Public auth endpoints (EXACT ones only)
                .requestMatchers("/api/auth/login",
                                 "/api/auth/register",
                                 "/api/auth/verify-email",
                                 "/api/auth/resend").permitAll()
                // NOTE: do NOT leave `/api/auth/**` wide-open; `/api/auth/me` must be authenticated.

                // Public reads
                .requestMatchers(HttpMethod.GET, "/api/books/**").permitAll()
                .requestMatchers("/api/pages/**", "/uploads/**",
                                 "/api/snake-questions/**", "/api/stories/**",
                                 "/api/ssa/**", "/api/snake-attempts/**").permitAll()

                // Open registration if you need it
                .requestMatchers(HttpMethod.POST, "/api/users").permitAll()

                // Role-protected
                .requestMatchers("/api/classrooms/join").hasAuthority("STUDENT")
                .requestMatchers("/api/classrooms/student/**").hasAuthority("STUDENT")
                .requestMatchers(HttpMethod.POST, "/api/books").hasAnyAuthority("ADMIN","TEACHER")
                .requestMatchers("/api/books/admin/**").hasAuthority("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/books/upload-image").hasAnyAuthority("ADMIN","TEACHER")

                // Everything else requires auth (this includes /api/auth/me)
                .anyRequest().authenticated()
            )

            // APIs get 401 instead of login HTML when unauthenticated
            .exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    new AntPathRequestMatcher("/api/**")
            ))

            // OAuth2 login wiring
            .oauth2Login(oauth -> oauth
                .authorizationEndpoint(ep -> ep.baseUri("/oauth2/authorization"))
                .redirectionEndpoint(ep -> ep.baseUri("/auth/microsoft/callback"))
                .successHandler(oauth2SuccessHandler)
                .failureHandler(oauth2FailureHandler)
            )

            // JWT before username/password
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

    /** CORS for your React dev origin */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.url:http://localhost:5173}") String appUrl
    ) {
        CorsConfiguration c = new CorsConfiguration();
        c.setAllowCredentials(true);
        // allow both localhost and 127.0.0.1 during dev
        c.setAllowedOrigins(List.of(appUrl, "http://localhost:5173", "http://127.0.0.1:5173"));
        c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
        c.setAllowedHeaders(List.of("Authorization","Content-Type","Accept","Origin","X-Requested-With"));
        c.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
        s.registerCorsConfiguration("/**", c);
        return s;
    }
}
