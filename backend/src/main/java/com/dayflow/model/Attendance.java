package com.dayflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Attendance entity - owned by M2.
 *
 * Maps to data dictionary §4.2. employeeId is stored as a plain String
 * (matching Employee.employeeId) rather than a JPA @ManyToOne relationship,
 * for hackathon speed and to keep JSON responses flat and predictable
 * for the frontend.
 */
@Entity
@Table(name = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK reference - matches Employee.employeeId, e.g. "EMP001"
    @Column(nullable = false)
    private String employeeId;

    // "2026-08-22"
    @Column(nullable = false)
    private LocalDate date;

    // ISO "2026-08-22T09:03:00" - null until check-in
    private LocalDateTime checkIn;

    // null until check-out
    private LocalDateTime checkOut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status;

    // Backend-computed on checkout; read-only from the frontend's perspective
    private Double workingHours;

    /**
     * Nested enum - not a separate file in the architecture tree (§3),
     * but must serialize with the exact same string values the frontend
     * hardcodes in ATTENDANCE_STATUSES (§4.0).
     */
    public enum AttendanceStatus {
        PRESENT,
        ABSENT,
        HALF_DAY,
        LEAVE
    }
}