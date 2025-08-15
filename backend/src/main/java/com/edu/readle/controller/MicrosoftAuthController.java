package com.edu.readle.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
public class MicrosoftAuthController {

  // Shown on your Register/Login pages as "Continue with Microsoft"
  @GetMapping("/auth/microsoft/start")
  public void start(HttpServletResponse res) throws IOException {
    // Spring Security will use the azure registration we set in application.properties
    res.sendRedirect("/oauth2/authorization/azure");
  }
}
