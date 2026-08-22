package com.dayflow.controller;

import com.dayflow.model.Employee;
import com.dayflow.model.Role;
import com.dayflow.repository.EmployeeRepository;
import com.dayflow.security.JwtUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

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

        @PostMapping({"/register", "/signup"})
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
                String employeeId = req.employeeId() == null || req.employeeId().isBlank()
                                ? generateEmployeeId() : req.employeeId();
        if (employeeRepository.existsByEmail(req.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Email already registered"));
        }
        if (employeeRepository.existsByEmployeeId(employeeId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse("Employee ID already in use"));
        }

        Employee employee = new Employee();
        employee.setEmployeeId(employeeId);
        employee.setName(req.name());
        employee.setEmail(req.email());
        employee.setPassword(passwordEncoder.encode(req.password()));
        employee.setRole(Role.EMPLOYEE);
        employee.setStatus("PENDING");
        employee.setEmailVerified(false);
        employee.setVerificationCode(String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000)));
        employee.setVerificationExpiresAt(LocalDateTime.now().plusMinutes(15));
        employee.setJoiningDate(LocalDate.now());
        employee.setJobTitle("Employee");

        Employee saved = employeeRepository.save(employee);

        // password excluded automatically via @JsonIgnore on the entity
        return ResponseEntity.status(HttpStatus.CREATED).body(new RegistrationResponse(
                saved.getEmail(), saved.getVerificationCode()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Employee employee = employeeRepository.findByEmail(req.email()).orElse(null);

        if (employee == null || !passwordEncoder.matches(req.password(), employee.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("Invalid email or password"));
        }
        if (!employee.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Please verify your email before signing in"));
        }
        if ("DEACTIVATED".equals(employee.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Your account has been deactivated"));
        }

        String token = jwtUtil.generateToken(
                employee.getEmail(),
                employee.getEmployeeId(),
                employee.getRole().name(),
                employee.getName()
        );

                return ResponseEntity.ok(new LoginResponse(token, new UserResponse(
                                employee.getId(), employee.getEmployeeId(), employee.getName(), employee.getEmail(),
                                employee.getRole().name(), employee.getStatus(), employee.getPhone(),
                                employee.getDepartment(), employee.getJobTitle(), employee.getJoiningDate()
                )));
    }

        @PostMapping("/verify-email")
        public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
                Employee employee = employeeRepository.findByEmail(req.email()).orElse(null);
                if (employee == null || employee.isEmailVerified()
                                || !req.code().equals(employee.getVerificationCode())
                                || employee.getVerificationExpiresAt() == null
                                || employee.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
                        return ResponseEntity.badRequest().body(new ErrorResponse("Invalid or expired verification code"));
                }
                employee.setEmailVerified(true);
                employee.setStatus("ACTIVE");
                employee.setVerificationCode(null);
                employee.setVerificationExpiresAt(null);
                employeeRepository.save(employee);
                return ResponseEntity.ok(new MessageResponse("Email verified successfully"));
        }

        private String generateEmployeeId() {
                String employeeId;
                do {
                        employeeId = "EMP" + ThreadLocalRandom.current().nextInt(100000, 999999);
                } while (employeeRepository.existsByEmployeeId(employeeId));
                return employeeId;
        }

    // ---- Request/response shapes (§4.5) ----

    public record RegisterRequest(
            String employeeId,
            @NotBlank String name,
            @Email @NotBlank String email,
            @NotBlank String password,
            Role role
    ) {}

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {}

    public record LoginResponse(String token, UserResponse user) {}

    public record UserResponse(Long id, String employeeId, String name, String email, String role,
                               String status, String phone, String department, String designation,
                               LocalDate joiningDate) {}

    public record RegistrationResponse(String email, String verificationCode) {}
    public record VerifyEmailRequest(@Email @NotBlank String email, @NotBlank String code) {}
    public record MessageResponse(String message) {}

    public record ErrorResponse(String message) {}
}