package com.dayflow.controller;

import com.dayflow.model.Employee;
import com.dayflow.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @GetMapping("/me")
    public ResponseEntity<Employee> getMyProfile(Authentication authentication) {
        String employeeId = authentication.getName(); // principal set in JwtFilter
        return ResponseEntity.ok(employeeService.getMyProfile(employeeId));
    }

    @PutMapping("/me")
    public ResponseEntity<Employee> updateMyProfile(Authentication authentication,
                                                      @RequestBody Employee updates) {
        String employeeId = authentication.getName();
        return ResponseEntity.ok(employeeService.updateMyProfile(employeeId, updates));
    }

    @GetMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id,
                                                      @Valid @RequestBody Employee updates) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, updates));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Employee> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployee(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Employee> approve(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.setStatus(id, "ACTIVE"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Employee> setStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        return ResponseEntity.ok(employeeService.setStatus(id, request.status()));
    }

    @PostMapping("/{id}/promote-to-hr")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Employee> promote(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.setRole(id, com.dayflow.model.Role.HR));
    }

    @PostMapping("/{id}/demote-to-employee")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Employee> demote(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.setRole(id, com.dayflow.model.Role.EMPLOYEE));
    }

    public record StatusRequest(String status) {}
}