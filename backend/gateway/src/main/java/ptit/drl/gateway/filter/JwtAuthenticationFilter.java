package ptit.drl.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * JWT Authentication Global Filter for Spring Cloud Gateway
 * Validates JWT tokens and adds user context to request headers
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret:your-256-bit-secret-key-change-this-in-production-minimum-32-characters-long}")
    private String jwtSecret;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        
        // Skip JWT validation for OPTIONS requests (CORS preflight)
        if (request.getMethod() != null && request.getMethod().name().equals("OPTIONS")) {
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(org.springframework.http.HttpStatus.OK);
            return response.setComplete();
        }
        
        // Skip JWT validation for public endpoints
        String path = request.getURI().getPath();
        if (isPublicEndpoint(path)) {
            return chain.filter(exchange);
        }

        // Get Authorization header
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            return onError(exchange, "Missing authorization header", HttpStatus.UNAUTHORIZED);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return onError(exchange, "Invalid authorization header", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);

        try {
            // Validate token
            if (!validateToken(token)) {
                return onError(exchange, "Invalid or expired token", HttpStatus.UNAUTHORIZED);
            }

            // Extract claims
            Claims claims = getClaims(token);
            
            // Add user context to request headers for downstream services
            ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-User-Name", claims.get("username", String.class))
                    .header("X-Username", claims.get("username", String.class)) // Keep for backward compatibility
                    .header("X-Roles", String.join(",", (List<String>) claims.get("roles")))
                    .header("X-Permissions", String.join(",", (List<String>) claims.get("permissions")))
                    .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        } catch (Exception e) {
            return onError(exchange, "Token validation failed: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/auth/register") ||
               path.startsWith("/api/auth/login") ||
               path.startsWith("/api/auth/refresh") ||
               path.startsWith("/api/auth/logout") ||
               path.startsWith("/api/auth/request-password") ||  // Public endpoint for password requests
               path.startsWith("/api/auth/me") ||  // /auth/me requires token but should pass through gateway
               path.startsWith("/api/students/hello") ||  // Test endpoint
               path.startsWith("/api/students/db-test") ||  // Test endpoint
               path.startsWith("/api/files/evidence/") ||  // Public file access (evidence files)
               path.startsWith("/api/evaluation-periods/open") ||  // Public endpoint to check open period
               path.startsWith("/actuator/");
    }

    private boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Mono<Void> onError(ServerWebExchange exchange, String message, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add("Content-Type", "application/json");
        
        // Add CORS headers for error responses to allow frontend to read the error
        ServerHttpRequest request = exchange.getRequest();
        String origin = request.getHeaders().getFirst("Origin");
        if (origin != null && (
            origin.equals("http://localhost:3000") || 
            origin.equals("http://localhost:3001") ||
            origin.equals("http://127.0.0.1:3000") ||
            origin.equals("http://127.0.0.1:3001")
        )) {
            response.getHeaders().add("Access-Control-Allow-Origin", origin);
            response.getHeaders().add("Access-Control-Allow-Credentials", "true");
            response.getHeaders().add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
            response.getHeaders().add("Access-Control-Allow-Headers", "*");
        }
        
        String errorBody = String.format("{\"success\":false,\"message\":\"%s\",\"timestamp\":[]}", message);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(errorBody.getBytes())));
    }

    @Override
    public int getOrder() {
        // Set order to run early in the filter chain
        return -100;
    }
}

