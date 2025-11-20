package ptit.drl.evaluation.exception;

/**
 * Exception thrown when attempting invalid workflow state transition
 */
public class InvalidStateTransitionException extends RuntimeException {
    
    public InvalidStateTransitionException(String message) {
        super(message);
    }
    
    public InvalidStateTransitionException(String currentState, String action) {
        super(String.format("Cannot perform '%s' action on evaluation in '%s' status", 
                          action, currentState));
    }
}

