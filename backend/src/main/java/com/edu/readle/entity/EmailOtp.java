package com.edu.readle.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_otp")
public class EmailOtp {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false) private String email;
  @Column(nullable = false, length = 6) private String code; // can hash later
  @Column(nullable = false) private LocalDateTime expiresAt;
  @Column(nullable = false) private boolean consumed = false;
  @Column(nullable = false) private int attempts = 0;

  // getters/setters
  public Long getId() { return id; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  public LocalDateTime getExpiresAt() { return expiresAt; }
  public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
  public boolean isConsumed() { return consumed; }
  public void setConsumed(boolean consumed) { this.consumed = consumed; }
  public int getAttempts() { return attempts; }
  public void setAttempts(int attempts) { this.attempts = attempts; }
}
