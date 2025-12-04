package ptit.drl.evaluation.util;

/**
 * Utility class for matching class codes against target specifications
 * Supports FACULTY:, MAJOR:, COHORT:, CLASS: prefixes
 * 
 * This class follows KISS and DRY principles by centralizing target matching logic
 * that was previously duplicated in EvaluationPeriodService and RubricService
 */
public class TargetMatcher {
    
    private TargetMatcher() {
        // Utility class - prevent instantiation
    }
    
    /**
     * Check if classCode matches target specification
     * Supports FACULTY:, MAJOR:, COHORT:, CLASS: prefixes
     * 
     * @param classCode The class code to check (e.g., "D21CQCN01-N")
     * @param targetClasses Target specification (e.g., "FACULTY:CNTT", "COHORT:D21", "CLASS:D21CQCN01-N")
     * @return true if classCode matches target, false otherwise
     */
    public static boolean matches(String classCode, String targetClasses) {
        if (targetClasses == null || targetClasses.isEmpty()) {
            return true; // Applies to all
        }
        
        String target = targetClasses.trim();
        
        // FACULTY: prefix
        if (target.startsWith("FACULTY:")) {
            return matchesFaculty(classCode, target.substring(8).trim());
        }
        
        // MAJOR: prefix
        if (target.startsWith("MAJOR:")) {
            return matchesMajor(classCode, target.substring(6).trim());
        }
        
        // COHORT: prefix
        if (target.startsWith("COHORT:")) {
            return matchesCohort(classCode, target.substring(7).trim());
        }
        
        // CLASS: prefix or legacy format
        String classCodes = target.startsWith("CLASS:") 
            ? target.substring(6).trim() 
            : target;
        
        return matchesClass(classCode, classCodes);
    }
    
    /**
     * Check if classCode matches faculty codes
     */
    private static boolean matchesFaculty(String classCode, String facultyCodes) {
        if (facultyCodes.isEmpty()) {
            return true; // All faculties
        }
        
        String[] faculties = facultyCodes.split(",");
        String classCodeUpper = classCode.toUpperCase();
        
        for (String faculty : faculties) {
            if (classCodeUpper.contains(faculty.trim().toUpperCase())) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if classCode matches major codes
     */
    private static boolean matchesMajor(String classCode, String majorCodes) {
        if (majorCodes.isEmpty()) {
            return true; // All majors
        }
        
        String[] majors = majorCodes.split(",");
        String classCodeUpper = classCode.toUpperCase();
        
        for (String major : majors) {
            if (classCodeUpper.contains(major.trim().toUpperCase())) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if classCode matches cohort codes
     * Cohort is extracted from first 3 characters (e.g., D21CQCN01-N -> D21)
     */
    private static boolean matchesCohort(String classCode, String cohortCodes) {
        if (cohortCodes.isEmpty()) {
            return true; // All cohorts
        }
        
        String classCohort = extractCohort(classCode);
        if (classCohort == null) {
            return false;
        }
        
        String[] cohorts = cohortCodes.split(",");
        for (String cohort : cohorts) {
            if (classCohort.equalsIgnoreCase(cohort.trim())) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if classCode matches exact class codes
     */
    private static boolean matchesClass(String classCode, String classCodes) {
        if (classCodes.isEmpty()) {
            return true; // All classes
        }
        
        String[] classes = classCodes.split(",");
        String classCodeTrimmed = classCode.trim();
        
        for (String targetClass : classes) {
            if (targetClass.trim().equalsIgnoreCase(classCodeTrimmed)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Extract cohort from class code
     * Example: D21CQCN01-N -> D21, D22CQPT01-N -> D22
     * Pattern: First letter + 2 digits
     * 
     * @param classCode The class code (e.g., "D21CQCN01-N")
     * @return The cohort (e.g., "D21") or null if pattern doesn't match
     */
    public static String extractCohort(String classCode) {
        if (classCode == null || classCode.length() < 3) {
            return null;
        }
        
        // Match pattern: letter + 2 digits at start (e.g., D21, D22, D23)
        String prefix = classCode.substring(0, 3).toUpperCase();
        if (prefix.matches("^[A-Z]\\d{2}$")) {
            return prefix;
        }
        return null;
    }
    
    /**
     * Check if two target scope specifications have overlapping coverage
     * 
     * Rules:
     * - If either is null/empty, it applies to ALL → overlaps with everything
     * - If both have specific targets, check if they share any common classes/faculties/majors/cohorts
     * 
     * @param target1 First target specification (e.g., "FACULTY:CNTT", "COHORT:D21", "CLASS:D21CQCN01-N")
     * @param target2 Second target specification
     * @return true if they overlap, false otherwise
     */
    public static boolean hasOverlap(String target1, String target2) {
        // If either is null/empty, it applies to ALL → overlaps with everything
        if (target1 == null || target1.trim().isEmpty() || target2 == null || target2.trim().isEmpty()) {
            return true;
        }
        
        String t1 = target1.trim();
        String t2 = target2.trim();
        
        // If they are exactly the same, they overlap
        if (t1.equalsIgnoreCase(t2)) {
            return true;
        }
        
        // Check prefix types
        String prefix1 = getPrefix(t1);
        String prefix2 = getPrefix(t2);
        
        if (prefix1.equals(prefix2)) {
            // Same prefix type - compare values
            return hasOverlappingValues(t1, t2, prefix1);
        } else {
            // Different prefix types - check if they might overlap
            return mightOverlapDifferentTypes(t1, t2);
        }
    }
    
    /**
     * Get the prefix of a target specification (FACULTY, MAJOR, COHORT, CLASS, or empty)
     */
    private static String getPrefix(String target) {
        if (target.startsWith("FACULTY:")) return "FACULTY";
        if (target.startsWith("MAJOR:")) return "MAJOR";
        if (target.startsWith("COHORT:")) return "COHORT";
        if (target.startsWith("CLASS:")) return "CLASS";
        return "CLASS"; // Legacy format without prefix is treated as CLASS
    }
    
    /**
     * Check if two target specifications with the same prefix have overlapping values
     */
    private static boolean hasOverlappingValues(String target1, String target2, String prefix) {
        String values1 = target1.substring(prefix.length() + 1).trim(); // Remove "PREFIX:"
        String values2 = target2.substring(prefix.length() + 1).trim();
        
        if (values1.isEmpty() || values2.isEmpty()) {
            return true; // Empty means all
        }
        
        String[] list1 = values1.split(",");
        String[] list2 = values2.split(",");
        
        // Check if any value in list1 matches any value in list2
        for (String v1 : list1) {
            for (String v2 : list2) {
                if (v1.trim().equalsIgnoreCase(v2.trim())) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if two target specifications with different prefix types might overlap
     * 
     * Logic:
     * - FACULTY is most general → overlaps with everything
     * - For other combinations, we assume they DON'T overlap (conservative approach)
     */
    private static boolean mightOverlapDifferentTypes(String target1, String target2) {
        String prefix1 = getPrefix(target1);
        String prefix2 = getPrefix(target2);
        
        // FACULTY is most general - it overlaps with everything
        if (prefix1.equals("FACULTY") || prefix2.equals("FACULTY")) {
            return true;
        }
        
        // If both are CLASS, check exact match
        if (prefix1.equals("CLASS") && prefix2.equals("CLASS")) {
            return hasOverlappingValues(target1, target2, "CLASS");
        }
        
        // For other combinations, assume they DON'T overlap
        // This is conservative - it might allow some periods that should conflict,
        // but it's better than blocking valid periods
        return false;
    }
}

