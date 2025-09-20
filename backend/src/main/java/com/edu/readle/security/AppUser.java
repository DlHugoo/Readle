package com.edu.readle.security;

import com.edu.readle.entity.Role;

public class AppUser {
    private final Long id;
    private final String email;
    private final Role role;

    public AppUser(Long id, String email, Role role) {
        this.id = id;
        this.email = email;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public Role getRole() { return role; }

    public Object getFirstName() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getFirstName'");
    }

    public Object getLastName() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getLastName'");
    }
}
