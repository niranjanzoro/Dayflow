package com.dayflow.controller;

import com.dayflow.model.Employee;
import com.dayflow.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * EmployeeController — owned by M2.
 *
 * /api/employees (list) and /api/employees/{id} (edit) are restricted to
 * ROLE_HR by SecurityConfig (file 11/16) — no @PreAuthorize needed here.
 * /api/employees/me falls through to "any authenticated user", which is
 * correct since every employee needs their own profile.
 *
 * The current user's employeeId comes from the JWT principal that JwtFilter
 * (file 10/16) sets on the SecurityContext — never trusted from the request
 * body, so an employee can't spoof another employeeId on /me calls.
 */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    // GET /api/employees/me
    @GetMapping("/me")
    public ResponseEntity<Employee> getMyProfile(Authentication authentication) {
        String employeeId = authentication.getName(); // principal set in JwtFilter
        return ResponseEntity.ok(employeeService.getMyProfile(employeeId));
    }

    // PUT /api/employees/me — body: { "phone", "address", "profilePicture" } only, per §4.1
    @PutMapping("/me")
    public ResponseEntity<Employee> updateMyProfile(Authentication authentication,
                                                      @RequestBody Employee updates) {
        String employeeId = authentication.getName();
        return ResponseEntity.ok(employeeService.updateMyProfile(employeeId, updates));
    }

    // GET /api/employees (HR only — enforced by SecurityConfig)
    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    // PUT /api/employees/{id} (HR only) — full Employee fields except password, per §4.1
    @PutMapping("/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id,
                                                     @Valid @RequestBody Employee updates) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, updates));
    }
}