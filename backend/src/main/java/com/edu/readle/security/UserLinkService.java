package com.edu.readle.security;

public interface UserLinkService {

    /**
     * Find an existing user by email or create one from the OIDC profile.
     * @param email       primary email from Microsoft
     * @param givenName   given_name (may be null/blank)
     * @param familyName  family_name (may be null/blank)
     * @return lightweight AppUser (id, email, role)
     */
    AppUser linkOrCreate(String email, String givenName, String familyName);

    // Optional: keep a back-compat alias if other code already calls a different name
    default AppUser linkOrCreateUser(String email, String givenName, String familyName) {
        return linkOrCreate(email, givenName, familyName);
    }
}
