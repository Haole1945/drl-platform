package ptit.drl.student.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.stream.Collectors;

/**
 * Security configuration for student-service
 * Trusts headers set by Gateway (X-User-Id, X-Roles, X-Permissions)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.disable()) // Disable CORS - Gateway handles it
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(new HeaderAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                // Swagger/OpenAPI endpoints (allow direct access)
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs", "/v3/api-docs/**").permitAll()
                // Actuator endpoints
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                // Test endpoints
                .requestMatchers("/students/hello", "/students/db-test").permitAll()
                // All requests are allowed (Gateway already validates JWT)
                // Method-level security will be enforced via @PreAuthorize
                .anyRequest().permitAll()
            );
        
        return http.build();
    }

    /**
     * Filter to extract user context from Gateway headers and set Authentication
     */
    private static class HeaderAuthenticationFilter extends OncePerRequestFilter {
        
        @Override
        protected void doFilterInternal(HttpServletRequest request, 
                                       HttpServletResponse response, 
                                       FilterChain filterChain) 
                throws ServletException, IOException {
            
            String userId = request.getHeader("X-User-Id");
            String username = request.getHeader("X-Username");
            String rolesHeader = request.getHeader("X-Roles");
            String permissionsHeader = request.getHeader("X-Permissions");
            
            // If headers are present (request came through Gateway with valid JWT)
            if (userId != null && username != null) {
                // Extract roles
                Collection<SimpleGrantedAuthority> authorities = Arrays.stream(
                    rolesHeader != null ? rolesHeader.split(",") : new String[0]
                )
                .filter(role -> !role.trim().isEmpty())
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.trim()))
                .collect(Collectors.toList());
                
                // Add permissions as authorities
                if (permissionsHeader != null) {
                    Arrays.stream(permissionsHeader.split(","))
                        .filter(perm -> !perm.trim().isEmpty())
                        .map(perm -> new SimpleGrantedAuthority(perm.trim()))
                        .forEach(authorities::add);
                }
                
                // Create authentication object
                Authentication authentication = new HeaderAuthentication(
                    Long.parseLong(userId),
                    username,
                    authorities
                );
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
            
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Custom Authentication object for header-based authentication
     */
    private static class HeaderAuthentication implements Authentication {
        private final Long userId;
        private final String username;
        private final Collection<SimpleGrantedAuthority> authorities;
        private boolean authenticated = true;

        public HeaderAuthentication(Long userId, String username, Collection<SimpleGrantedAuthority> authorities) {
            this.userId = userId;
            this.username = username;
            this.authorities = authorities;
        }

        @Override
        public Collection<SimpleGrantedAuthority> getAuthorities() {
            return authorities;
        }

        @Override
        public Object getCredentials() {
            return null;
        }

        @Override
        public Object getDetails() {
            return userId;
        }

        @Override
        public Object getPrincipal() {
            return username;
        }

        @Override
        public boolean isAuthenticated() {
            return authenticated;
        }

        @Override
        public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
            this.authenticated = isAuthenticated;
        }

        @Override
        public String getName() {
            return username;
        }

        public Long getUserId() {
            return userId;
        }
    }
}

