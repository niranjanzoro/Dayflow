package com.dayflow.controller;

import com.dayflow.model.LeaveRequest;
import com.dayflow.service.LeaveService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Owned by M3.
 * REST endpoints for the leave workflow — see §4.3 for exact request/response
 * shapes. Assumes M2's JwtFilter populates the Spring Security Authentication
 * with the employee's employeeId as the principal name, and role as an
 * authority string ("EMPLOYEE" / "HR") — confirm this against M2's actual
 * SecurityConfig/JwtFilter implementation once it lands (Hour 3, M2's track)
 * and adjust @PreAuthorize / authentication.getName() usage if it differs.
 */
@RestController
@RequestMapping("/api/leave")
public class LeaveController {

    private final LeaveService leaveService;

    @Autowired
    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    /** POST /api/leave — employee submits a new leave request */
    @PostMapping
    public ResponseEntity<LeaveRequest> submit(@RequestBody SubmitLeaveRequest body,
                                                Authentication authentication) {
        String employeeId = authentication.getName();
        LeaveRequest created = leaveService.submit(
                employeeId, body.leaveType(), body.startDate(), body.endDate(), body.remarks());
        return ResponseEntity.ok(created);
    }

    /** GET /api/leave/me — employee's own leave history */
    @GetMapping("/me")
    public ResponseEntity<List<LeaveRequest>> getMine(Authentication authentication) {
        String employeeId = authentication.getName();
        return ResponseEntity.ok(leaveService.findByEmployeeId(employeeId));
    }

    /** GET /api/leave — HR views all leave requests */
    @GetMapping
    @PreAuthorize("hasAuthority('HR')")
    public ResponseEntity<List<LeaveRequest>> getAll() {
        return ResponseEntity.ok(leaveService.findAll());
    }

    /** PUT /api/leave/{id}/approve — HR approves */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('HR')")
    public ResponseEntity<LeaveRequest> approve(@PathVariable Long id,
                                                 @RequestBody AdminCommentRequest body,
                                                 Authentication authentication) {
        String hrEmployeeId = authentication.getName();
        return ResponseEntity.ok(leaveService.approve(id, hrEmployeeId, body.adminComment()));
    }

    /** PUT /api/leave/{id}/reject — HR rejects */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('HR')")
    public ResponseEntity<LeaveRequest> reject(@PathVariable Long id,
                                                @RequestBody AdminCommentRequest body,
                                                Authentication authentication) {
        String hrEmployeeId = authentication.getName();
        return ResponseEntity.ok(leaveService.reject(id, hrEmployeeId, body.adminComment()));
    }

    // --- Request body shapes (match §4.3 exactly) ---

    public record SubmitLeaveRequest(
            LeaveRequest.LeaveType leaveType,
            LocalDate startDate,
            LocalDate endDate,
            String remarks) {
    }

    public record AdminCommentRequest(String adminComment) {
    }
}