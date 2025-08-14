package com.edu.readle.security;

import com.edu.readle.entity.Role;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.UserRepository;
import com.edu.readle.service.BadgeService;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final BadgeService badgeService;

    public CustomOAuth2UserService(UserRepository userRepository, BadgeService badgeService) {
        this.userRepository = userRepository;
        this.badgeService = badgeService;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        // Extract user details from OAuth2User
        Map<String, Object> attributes = oAuth2User.getAttributes();
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        
        // Check if user exists in our database
        Optional<UserEntity> userOptional = userRepository.findByEmail(email);
        
        if (userOptional.isEmpty()) {
            // Create a new user if not exists
            UserEntity newUser = new UserEntity();
            newUser.setEmail(email);
            
            // Split name into first and last name if possible
            if (name != null && name.contains(" ")) {
                String[] nameParts = name.split(" ", 2);
                newUser.setFirstName(nameParts[0]);
                newUser.setLastName(nameParts[1]);
            } else {
                newUser.setFirstName(name);
                newUser.setLastName("");
            }
            
            // Generate a username based on email
            String username = email.split("@")[0] + "_" + System.currentTimeMillis();
            newUser.setUsername(username);
            
            // Set a default role - you might want to adjust this based on your requirements
            newUser.setRole(Role.STUDENT);
            
            // Set a random password or leave it null if your system doesn't require it for OAuth users
            // newUser.setPassword(null); // Password not needed for OAuth login
            
            // Save the new user
            userRepository.save(newUser);
            
            // Track first login for badge
            badgeService.trackUserLogin(newUser.getId());
        } else {
            // Update existing user information if needed
            UserEntity existingUser = userOptional.get();
            badgeService.trackUserLogin(existingUser.getId());
        }
        
        return oAuth2User;
    }
}