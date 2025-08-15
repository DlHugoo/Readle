package com.edu.readle.security;

import com.edu.readle.entity.Role;
import com.edu.readle.entity.UserEntity;
import com.edu.readle.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserLinkServiceImpl implements UserLinkService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserLinkServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AppUser linkOrCreate(String email, String givenName, String familyName) {
        // 1) find or create user by email
        UserEntity user = userRepository.findByEmail(email).orElseGet(() -> {
            UserEntity u = new UserEntity();
            u.setEmail(email);
            u.setUsername(suggestUsername(email));
            u.setFirstName(safe(givenName));
            u.setLastName(safe(familyName));
            // random encoded password (unused for OAuth2 logins)
            u.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            // choose a sensible default role
            u.setRole(Role.STUDENT);
            return u;
        });

        // 2) update missing profile fields
        if (isBlank(user.getFirstName()) && !isBlank(givenName)) user.setFirstName(givenName);
        if (isBlank(user.getLastName())  && !isBlank(familyName)) user.setLastName(familyName);
        if (isBlank(user.getUsername())) user.setUsername(suggestUsername(email));

        // 3) mark as verified (Microsoft account is already verified)
        user.setEmailVerified(true);
        if (user.getEmailVerifiedAt() == null) {
            user.setEmailVerifiedAt(LocalDateTime.now());
        }

        user = userRepository.save(user);

        return new AppUser(user.getId(), user.getEmail(), user.getRole());
    }

    private static String suggestUsername(String email) {
        String base = email == null ? "user" : email.split("@")[0].replaceAll("[^a-zA-Z0-9_.-]", "");
        // keep it deterministic but unique enough by appending 4 chars of a UUID
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 4);
        return base + "-" + suffix;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }
}
