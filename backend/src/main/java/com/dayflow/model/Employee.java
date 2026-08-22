package com.dayflow.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Employee entity - owned by M2.
 *
 * Maps to data dictionary §4.1. `password` is excluded from JSON output
 * via @JsonIgnore so it is NEVER returned in any API response, including
 * GET /api/employees and GET /api/employees/me.
 */
@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // e.g. "EMP001" - set at creation, never changed after
    @Column(nullable = false, unique = true)
    private String employeeId;

    @Column(nullable = false)
    private String name;

    // Used as the login username - must be unique
    @Column(nullable = false, unique = true)
    private String email;

    // Write-only: never serialized back to the client
    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String phone;

    private String address;

    // Base64 string or URL - stored as text for hackathon speed
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String profilePicture;

    private String jobTitle;

    private String department;

    // ISO format, e.g. "2026-08-22"
    private LocalDate joiningDate;
}