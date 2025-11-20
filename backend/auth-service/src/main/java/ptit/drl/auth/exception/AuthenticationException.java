package ptit.drl.auth.exception;

/**
 * Exception thrown when authentication fails (invalid credentials, inactive account, etc.)
 */
public class AuthenticationException extends RuntimeException {
    
    public AuthenticationException(String message) {
        super(message);
    }
    
    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}

