package com.dayflow.controller;

import com.dayflow.model.Payroll;
import com.dayflow.service.PayrollService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Owned by M3.
 * REST endpoints for payroll — see §4.4 for exact request/response shapes.
 * Same auth assumptions as LeaveController: authentication.getName() ==
 * employeeId, role exposed as authority "HR" — confirm against M2's
 * JwtFilter/SecurityConfig once live and adjust if it differs.
 */
@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    @Autowired
    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    /** GET /api/payroll/me — employee's own payroll (read-only) */
    @GetMapping("/me")
    public ResponseEntity<Payroll> getMine(Authentication authentication) {
        String employeeId = authentication.getName();
        Optional<Payroll> payroll = payrollService.findByEmployeeId(employeeId);
        return payroll.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Payroll> create(@RequestBody CreatePayrollRequest body) {
        return ResponseEntity.ok(payrollService.create(body.employeeId(), body.month(), body.year(), body.basic(),
                body.hra(), body.allowances(), body.deductions()));
    }

    /** GET /api/payroll — HR views all payroll records */
    @GetMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<Payroll>> getAll() {
        return ResponseEntity.ok(payrollService.findAll());
    }

    /** PUT /api/payroll/{id} — HR edits salary fields; netSalary recomputed server-side */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('HR')")
    public ResponseEntity<Payroll> update(@PathVariable Long id, @RequestBody UpdatePayrollRequest body) {
        Payroll updated = payrollService.update(
                id, body.basicSalary(), body.hra(), body.allowances(), body.deductions(),
                body.payPeriod(), body.status());
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/mark-paid")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Payroll> markPaid(@PathVariable Long id) {
        return ResponseEntity.ok(payrollService.markPaid(id));
    }

    // --- Request body shape (matches §4.4 exactly) ---

    public record UpdatePayrollRequest(
            Double basicSalary,
            Double hra,
            Double allowances,
            Double deductions,
            String payPeriod,
            Payroll.PayrollStatus status) {
    }

    public record CreatePayrollRequest(String employeeId, String month, Integer year, Double basic,
                                       Double hra, Double allowances, Double deductions) {}
}