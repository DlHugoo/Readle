package com.edu.readle.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "users")
public class UserEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    // NEW: link to Microsoft account (OIDC "sub")
    @Column(unique = true)                 // nullable, but unique when present
    private String microsoftId;

    @Column private String firstName;
    @Column private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean emailVerified = false;

    @Column
    private LocalDateTime emailVerifiedAt;

  // Getters and Setters
    public String getMicrosoftId() { return microsoftId; }
    public void setMicrosoftId(String microsoftId) { this.microsoftId = microsoftId; }
  
    public Long getId() {
        return userId;
    }

    public String getFirstName() {
        return firstName;
    }
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }

    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }

    public Role getRole() {
        return role;
    }
    public void setRole(Role role) {
        this.role = role;
    }

    // Email verification accessors
    public boolean isEmailVerified() {
        return emailVerified;
    }
    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }
    public LocalDateTime getEmailVerifiedAt() {
        return emailVerifiedAt;
    }
    public void setEmailVerifiedAt(LocalDateTime emailVerifiedAt) {
        this.emailVerifiedAt = emailVerifiedAt;
    }

    // equals/hashCode based on userId
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserEntity that = (UserEntity) o;
        return Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId);
    }
}
