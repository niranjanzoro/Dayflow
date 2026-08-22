package com.dayflow.model;

/**
 * User roles for Dayflow HRMS.
 * Owner: M2
 *
 * Used on Employee.role and embedded as a claim in the JWT token.
 * Frontend must use these exact string values (see data dictionary §4.0) —
 * "EMPLOYEE" and "HR", all-caps, no translation.
 */
public enum Role {
    EMPLOYEE,
    HR
}