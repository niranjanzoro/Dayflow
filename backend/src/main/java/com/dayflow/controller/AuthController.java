package com.dayflow.controller;

import com.dayflow.model.Employee;
import com.dayflow.model.Role;
import com.dayflow.repository.EmployeeRepository;
import com.dayflow.security.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Auth endpoints - owned by M2.
 * Maps to data dictionary §4.5. Public (see SecurityConfig: /api/auth/** permitAll).
 *
 * Auth is not a separate entity - it reuses Employee (email + password + role
 * live on the Employee table), avoiding a redundant User table for the hackathon.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(EmployeeRepository employeeRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (employeeRepository.existsByEmail(req.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Email already registered"));
        }
        if (employeeRepository.existsByEmployeeId(req.employeeId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Employee ID already in use"));
        }

        Employee employee = new Employee();
        employee.setEmployeeId(req.employeeId());
        employee.setName(req.name());
        employee.setEmail(req.email());
        employee.setPassword(passwordEncoder.encode(req.password()));
        employee.setRole(req.role());

        Employee saved = employeeRepository.save(employee);

        // password excluded automatically via @JsonIgnore on the entity
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Employee employee = employeeRepository.findByEmail(req.email()).orElse(null);

        if (employee == null || !passwordEncoder.matches(req.password(), employee.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password"));
        }

        String token = jwtUtil.generateToken(
                employee.getEmail(),
                employee.getEmployeeId(),
                employee.getRole().name(),
                employee.getName()
        );

        return ResponseEntity.ok(new LoginResponse(
                token,
                employee.getRole().name(),
                employee.getEmployeeId(),
                employee.getName()
        ));
    }

    // ---- Request/response shapes (§4.5) ----

    public record RegisterRequest(
            @NotBlank String employeeId,
            @NotBlank String name,
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotNull Role role
    ) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record LoginResponse(
            String token,
            String role,
            String employeeId,
            String name
    ) {}

    public record ErrorResponse(String message) {}
}