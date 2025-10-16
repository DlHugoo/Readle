# 🔐 Migration from localStorage to Secure Storage

## Overview

This guide helps you migrate from `localStorage` to more secure storage solutions.

## 📊 Storage Comparison Table

| Storage Type | Security | Persistence | Size Limit | Best For |
|-------------|----------|-------------|------------|----------|
| **localStorage** | ❌ Low (XSS vulnerable) | Permanent | 5-10MB | ⛔ NOT RECOMMENDED |
| **sessionStorage** | ⚠️ Medium | Tab session | 5-10MB | Temporary UI state |
| **HTTPOnly Cookies** | ✅ High | Configurable | 4KB | **Auth tokens** |
| **Memory (Context)** | ✅ High | Page session | Unlimited | Sensitive session data |
| **IndexedDB** | ⚠️ Medium | Permanent | 50MB-1GB+ | Large data, offline cache |
| **Encrypted Storage** | ✅ High | Permanent | 5-10MB | Sensitive data (if needed) |

---

## 🎯 Migration Strategy

### Phase 1: Backend Changes (Required for HTTPOnly Cookies)

#### 1.1 Update Spring Boot Security Configuration

```java
// src/main/java/com/edu/readle/config/SecurityConfig.java

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Or configure CSRF with cookies
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
            
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true); // IMPORTANT for cookies
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "https://your-production-domain.com"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

#### 1.2 Update Authentication Controller

```java
// src/main/java/com/edu/readle/controller/AuthController.java

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @PostMapping("/login")
    public ResponseEntity<?> login(
        @RequestBody LoginRequest request,
        HttpServletResponse response
    ) {
        // Authenticate user
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getEmail(),
                request.getPassword()
            )
        );
        
        // Generate JWT
        String token = jwtService.generateToken(auth);
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Set HTTPOnly cookie
        ResponseCookie cookie = ResponseCookie.from("token", token)
            .httpOnly(true)           // Not accessible via JavaScript
            .secure(true)             // Only sent over HTTPS (disable for local dev)
            .path("/")                // Available for all paths
            .maxAge(7 * 24 * 60 * 60) // 7 days
            .sameSite("Strict")       // CSRF protection
            .build();
            
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        
        // Return user data (NOT the token)
        return ResponseEntity.ok(new LoginResponse(
            user.getId(),
            user.getEmail(),
            user.getRole()
        ));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Clear the cookie
        ResponseCookie cookie = ResponseCookie.from("token", "")
            .httpOnly(true)
            .secure(true)
            .path("/")
            .maxAge(0) // Expire immediately
            .sameSite("Strict")
            .build();
            
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
        @CookieValue(name = "token", required = false) String token
    ) {
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // Validate token and return user
        String email = jwtService.extractUsername(token);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
            
        return ResponseEntity.ok(new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getRole()
        ));
    }
}
```

#### 1.3 Update JWT Filter to Read from Cookies

```java
// src/main/java/com/edu/readle/security/JwtAuthenticationFilter.java

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtService jwtService;
    
    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        
        String token = null;
        
        // Try to get token from cookie first
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }
        
        // Fallback to Authorization header (for backward compatibility)
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }
        
        if (token != null && jwtService.validateToken(token)) {
            String username = jwtService.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        filterChain.doFilter(request, response);
    }
}
```

---

### Phase 2: Frontend Changes

#### 2.1 Update api.js

```javascript
// src/api/api.js
import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "";

export const apiClient = axios.create({
  baseURL: BASE || undefined,
  withCredentials: true, // ✅ IMPORTANT: This sends cookies automatically
  headers: { "Content-Type": "application/json" },
});

// ✅ Remove token interceptor - cookies are sent automatically
// No need to manually attach Authorization header

// Auto-logout on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      window.location.replace("/login?expired=1");
    }
    return Promise.reject(err);
  }
);

// Updated auth functions
export const login = async ({ email, password }) => {
  // Backend will set HTTPOnly cookie automatically
  const { data } = await apiClient.post("/api/auth/login", { email, password });
  return data; // { userId, role, email }
};

export const logout = async () => {
  // Backend will clear the cookie
  await apiClient.post("/api/auth/logout");
};

export const getMe = async () => {
  const { data } = await apiClient.get("/api/auth/me");
  return data;
};
```

#### 2.2 Replace AuthContext

Replace your current `AuthContext.jsx` with `SecureAuthContext.jsx` (already created).

```javascript
// src/main.jsx
import { AuthProvider } from "./contexts/SecureAuthContext"; // ✅ New import
```

#### 2.3 Update Components to Use New Context

**Before:**
```javascript
// OLD CODE - Don't use this anymore
const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const role = localStorage.getItem("role");
```

**After:**
```javascript
// NEW CODE - Use this instead
import { useAuth } from "../contexts/SecureAuthContext";

function MyComponent() {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  // Access user data from context
  const userId = user.userId;
  const role = user.role;
  
  // Make API calls - token sent automatically via cookie
  const fetchData = async () => {
    const response = await apiClient.get("/api/some-endpoint");
    // Token is sent automatically with the request
  };
}
```

#### 2.4 Migrate UI State to sessionStorage

**Before:**
```javascript
// OLD CODE
localStorage.setItem("hasSeenJoinPrompt", "true");
const hasSeenPrompt = localStorage.getItem("hasSeenJoinPrompt");
```

**After:**
```javascript
// NEW CODE
import { sessionStore } from "../utils/secureStorage";

sessionStore.set("hasSeenJoinPrompt", true);
const hasSeenPrompt = sessionStore.get("hasSeenJoinPrompt");
```

---

## 🔄 Step-by-Step Migration Checklist

### Backend (Spring Boot)

- [ ] Update `SecurityConfig` to allow credentials in CORS
- [ ] Modify login endpoint to set HTTPOnly cookie
- [ ] Add logout endpoint to clear cookie
- [ ] Update `/api/auth/me` endpoint to read from cookie
- [ ] Modify `JwtAuthenticationFilter` to extract token from cookie
- [ ] Test authentication flow with Postman

### Frontend (React)

- [ ] Update `apiClient` to use `withCredentials: true`
- [ ] Remove token interceptors (cookies sent automatically)
- [ ] Replace `AuthContext.jsx` with `SecureAuthContext.jsx`
- [ ] Update login pages to use new auth context
- [ ] Replace all `localStorage.getItem("token")` with context
- [ ] Replace all `localStorage.getItem("userId")` with `user.userId`
- [ ] Replace all `localStorage.getItem("role")` with `user.role`
- [ ] Migrate UI state to `sessionStorage`
- [ ] Remove all localStorage references for auth data
- [ ] Test authentication flow

---

## 📝 Specific File Updates Needed

Here are the files you need to update:

### High Priority (Authentication)

1. **frontend_web/src/contexts/AuthContext.jsx** → Replace with `SecureAuthContext.jsx`
2. **frontend_web/src/api/api.js** → Update as shown above
3. **frontend_web/src/pages/loginPage/LoginPage.jsx**
4. **frontend_web/src/pages/loginPage/AdminLoginPage.jsx**
5. **frontend_web/src/pages/registerPage/SignupPage.jsx**

### Medium Priority (Components using auth)

6. All files in `frontend_web/src/pages/classroom/`
7. All files in `frontend_web/src/pages/studentPage/`
8. All files in `frontend_web/src/pages/bookTeacherPage/`
9. `frontend_web/src/components/TeacherNav.jsx`

### Low Priority (UI State)

10. Replace `hasSeenJoinPrompt` localStorage with sessionStorage
11. Replace `pendingEmail` localStorage with sessionStorage

---

## 🧪 Testing

### Test HTTPOnly Cookies

1. Open DevTools → Application → Cookies
2. After login, you should see a cookie named `token`
3. Verify it has `HttpOnly` flag ✅
4. Try `console.log(document.cookie)` - token should NOT appear

### Test Authentication

```javascript
// In browser console
// This should NOT show the token (security ✅)
console.log(document.cookie);

// This should work (token sent automatically)
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

---

## 🚀 Quick Start (Minimal Changes)

If you want to start small, here's the absolute minimum:

1. **Backend**: Update login to set HTTPOnly cookie
2. **Frontend**: Change `withCredentials: true` in apiClient
3. **Frontend**: Use `SecureAuthContext.jsx` instead of current AuthContext

Everything else can be migrated gradually.

---

## 🆘 Troubleshooting

### "Token not being sent with requests"
- Check `withCredentials: true` in axios config
- Verify CORS allows credentials on backend
- Ensure cookie `path=/` matches request path

### "Cookie not being set"
- For local development, set `secure: false` in cookie options
- Check browser console for CORS errors
- Verify response headers include `Set-Cookie`

### "401 Unauthorized after refresh"
- Check cookie expiration (`maxAge`)
- Verify `/api/auth/me` endpoint works
- Check if cookie is being sent (Network tab → Cookies)

---

## 📚 Additional Resources

- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [Spring Security: CORS](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)


