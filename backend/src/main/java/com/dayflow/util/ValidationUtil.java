package com.dayflow.util;

import java.util.regex.Pattern;

/**
 * Input Validation Utilities
 * 
 * Provides centralized validation methods to prevent:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - Format validation
 * - Business logic validation
 */
public class ValidationUtil {

    // Regex patterns for validation
    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$");
    
    private static final Pattern EMPLOYEE_ID_PATTERN = 
        Pattern.compile("^[A-Z0-9]{3,10}$"); // e.g., EMP001, EMP002
    
    private static final Pattern PHONE_PATTERN = 
        Pattern.compile("^[0-9\\-\\+\\(\\)\\s]{7,20}$"); // Flexible phone format
    
    private static final Pattern NAME_PATTERN = 
        Pattern.compile("^[a-zA-Z\\s\\-'.]{2,100}$"); // Names with common characters
    
    // Minimum password length (should match frontend)
    private static final int MIN_PASSWORD_LENGTH = 8;
    
    // Maximum string lengths for input fields
    private static final int MAX_NAME_LENGTH = 100;
    private static final int MAX_EMAIL_LENGTH = 255;
    private static final int MAX_PHONE_LENGTH = 20;
    private static final int MAX_DESIGNATION_LENGTH = 50;
    private static final int MAX_DEPARTMENT_LENGTH = 50;

    /**
     * Validates email format
     * @param email Email to validate
     * @return true if valid
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isBlank() || email.length() > MAX_EMAIL_LENGTH) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * Validates password strength
     * Requirements: >= 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
     * @param password Password to validate
     * @return true if meets requirements
     */
    public static boolean isValidPassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            return false;
        }
        
        boolean hasUppercase = password.matches(".*[A-Z].*");
        boolean hasLowercase = password.matches(".*[a-z].*");
        boolean hasDigit = password.matches(".*[0-9].*");
        
        return hasUppercase && hasLowercase && hasDigit;
    }

    /**
     * Validates employee name
     * @param name Name to validate
     * @return true if valid
     */
    public static boolean isValidName(String name) {
        if (name == null || name.isBlank() || name.length() > MAX_NAME_LENGTH) {
            return false;
        }
        return NAME_PATTERN.matcher(name).matches();
    }

    /**
     * Validates phone number
     * @param phone Phone to validate
     * @return true if valid
     */
    public static boolean isValidPhone(String phone) {
        if (phone == null || phone.isBlank() || phone.length() > MAX_PHONE_LENGTH) {
            return false;
        }
        return PHONE_PATTERN.matcher(phone).matches();
    }

    /**
     * Validates employee ID format
     * @param employeeId ID to validate
     * @return true if valid
     */
    public static boolean isValidEmployeeId(String employeeId) {
        if (employeeId == null || employeeId.isBlank()) {
            return false;
        }
        return EMPLOYEE_ID_PATTERN.matcher(employeeId).matches();
    }

    /**
     * Validates designation length
     * @param designation Designation to validate
     * @return true if valid
     */
    public static boolean isValidDesignation(String designation) {
        return designation != null && 
               !designation.isBlank() && 
               designation.length() <= MAX_DESIGNATION_LENGTH;
    }

    /**
     * Validates department length
     * @param department Department to validate
     * @return true if valid
     */
    public static boolean isValidDepartment(String department) {
        return department != null && 
               !department.isBlank() && 
               department.length() <= MAX_DEPARTMENT_LENGTH;
    }

    /**
     * Sanitizes string input to prevent XSS
     * Removes potentially dangerous HTML/JavaScript
     * @param input String to sanitize
     * @return Sanitized string
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }
        
        return input
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&#39;")
            .replaceAll("&", "&amp;");
    }

    /**
     * Validates that a string contains no SQL injection attempts
     * @param input String to check
     * @return true if safe
     */
    public static boolean isSqlSafe(String input) {
        if (input == null) {
            return true; // null is safe (parameterized queries handle it)
        }
        
        // Check for common SQL injection patterns
        String lowerInput = input.toLowerCase();
        return !lowerInput.contains("drop ") &&
               !lowerInput.contains("insert ") &&
               !lowerInput.contains("update ") &&
               !lowerInput.contains("delete ") &&
               !lowerInput.contains("union ") &&
               !lowerInput.contains("select ") &&
               !lowerInput.contains("exec ") &&
               !lowerInput.contains("execute ") &&
               !lowerInput.contains("';") &&
               !lowerInput.contains("--") &&
               !lowerInput.contains("/*") &&
               !lowerInput.contains("*/");
    }

    /**
     * Validates that a value is within an expected range
     * @param value Value to check
     * @param min Minimum (inclusive)
     * @param max Maximum (inclusive)
     * @return true if value is in range
     */
    public static boolean isInRange(int value, int min, int max) {
        return value >= min && value <= max;
    }

    /**
     * Validates that a string is not empty after trimming
     * @param value String to check
     * @return true if not empty
     */
    public static boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
