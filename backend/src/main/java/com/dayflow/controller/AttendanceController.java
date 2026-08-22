package com.dayflow.controller;

import com.dayflow.model.Attendance;
import com.dayflow.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * AttendanceController — owned by M2.
 *
 * /api/attendance (HR-only daily view) is restricted by SecurityConfig
 * (file 11/16); everything else here just needs an authenticated user.
 * Current employeeId always comes from the JWT principal (JwtFilter,
 * file 10/16), never from the request — so no one can check in as
 * someone else.
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    // POST /api/attendance/checkin
    @PostMapping({"/checkin", "/clock-in"})
    public ResponseEntity<Attendance> checkIn(Authentication authentication) {
        String employeeId = authentication.getName();
        return ResponseEntity.ok(attendanceService.checkIn(employeeId));
    }

    // POST /api/attendance/checkout
    @PostMapping({"/checkout", "/clock-out"})
    public ResponseEntity<Attendance> checkOut(Authentication authentication) {
        String employeeId = authentication.getName();
        return ResponseEntity.ok(attendanceService.checkOut(employeeId));
    }

    // GET /api/attendance/me?start=2026-08-01&end=2026-08-22 (both optional)
    @GetMapping("/me")
    public ResponseEntity<List<Attendance>> getMyAttendance(
            Authentication authentication,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        String employeeId = authentication.getName();
        return ResponseEntity.ok(attendanceService.getMyAttendance(employeeId, start, end));
    }

    @GetMapping("/me/today")
    public ResponseEntity<Attendance> getToday(Authentication authentication) {
        return attendanceService.getMyAttendance(authentication.getName(), LocalDate.now(), LocalDate.now())
                .stream().findFirst().map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    // GET /api/attendance?date=2026-08-22 (HR only — enforced by SecurityConfig)
    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<Attendance>> getAttendanceByDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return ResponseEntity.ok(attendanceService.getAttendanceByDate(date == null ? LocalDate.now() : date));
    }
}