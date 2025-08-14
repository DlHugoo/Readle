package com.edu.readle.security;

import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public OAuth2AuthenticationSuccessHandler(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) 
            throws IOException, ServletException {
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        
        if (email != null) {
            Optional<UserEntity> userOptional = userRepository.findByEmail(email);
            
            if (userOptional.isPresent()) {
                UserEntity user = userOptional.get();
                String token = jwtService.generateToken(email, user.getId());
                
                // Redirect to frontend with token
                String redirectUrl = "http://localhost:5173/oauth2/redirect?token=" + token + 
                                    "&role=" + user.getRole() + 
                                    "&userId=" + user.getId();
                
                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
                return;
            }
        }
        
        // Fallback redirect if something went wrong
        getRedirectStrategy().sendRedirect(request, response, "http://localhost:5173/login?error=authentication_failed");
    }
}