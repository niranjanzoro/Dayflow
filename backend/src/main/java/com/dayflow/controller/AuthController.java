package com.dayflow.controller;

import com.dayflow.model.Employee;
import com.dayflow.model.Role;
import com.dayflow.repository.EmployeeRepository;
import com.dayflow.security.JwtUtil;
import com.dayflow.service.EmailService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${dayflow.verification.code-ttl-minutes:15}")
    private int verificationTtlMinutes;

    public AuthController(EmployeeRepository employeeRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil,
                           EmailService emailService) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
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
        String code = generateVerificationCode();
        employee.setVerificationCode(code);
        employee.setVerificationExpiresAt(LocalDateTime.now().plusMinutes(verificationTtlMinutes));
        employee.setJoiningDate(LocalDate.now());
        employee.setJobTitle("Employee");
        employee.setFailedLoginAttempts(0);
        employee.setLocked(false);

        Employee saved = employeeRepository.save(employee);
        emailService.sendVerificationCode(saved.getEmail(), saved.getName(), code);

        // SECURITY: the verification code is only ever delivered by email -
        // it is never returned in the API response.
        return ResponseEntity.status(HttpStatus.CREATED).body(new MessageResponse(
                "Account created. A verification code was sent to " + saved.getEmail()
                        + ". It expires in " + verificationTtlMinutes + " minutes."));
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
        if ("PENDING".equals(employee.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("Your account is awaiting HR approval. You will be able to sign in once HR approves it."));
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
                                || !req.code().trim().equals(employee.getVerificationCode())
                                || employee.getVerificationExpiresAt() == null
                                || employee.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
                        return ResponseEntity.badRequest().body(new ErrorResponse("Invalid or expired verification code"));
                }
                // Verification only proves the email is real. The account stays
                // PENDING until HR approves it - see EmployeeController approve.
                employee.setEmailVerified(true);
                employee.setVerificationCode(null);
                employee.setVerificationExpiresAt(null);
                employeeRepository.save(employee);
                return ResponseEntity.ok(new MessageResponse(
                                "Email verified successfully. Your account is awaiting HR approval."));
        }

        @PostMapping("/resend-verification")
        public ResponseEntity<?> resendVerification(@Valid @RequestBody ResendVerificationRequest req) {
                Employee employee = employeeRepository.findByEmail(req.email()).orElse(null);
                // Same response whether or not the account exists, so the API
                // never leaks which emails are registered.
                if (employee == null) {
                        return ResponseEntity.ok(new MessageResponse(
                                        "If that email is registered, a new verification code has been sent."));
                }
                if (employee.isEmailVerified()) {
                        return ResponseEntity.badRequest().body(new ErrorResponse("Email is already verified"));
                }
                String code = generateVerificationCode();
                employee.setVerificationCode(code);
                employee.setVerificationExpiresAt(LocalDateTime.now().plusMinutes(verificationTtlMinutes));
                employeeRepository.save(employee);
                emailService.sendVerificationCode(employee.getEmail(), employee.getName(), code);
                return ResponseEntity.ok(new MessageResponse("A new verification code has been sent."));
        }

        private String generateEmployeeId() {
                String employeeId;
                do {
                        employeeId = "EMP" + ThreadLocalRandom.current().nextInt(100000, 999999);
                } while (employeeRepository.existsByEmployeeId(employeeId));
                return employeeId;
        }

        private String generateVerificationCode() {
                return String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
        }

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

    public record VerifyEmailRequest(@Email @NotBlank String email, @NotBlank String code) {}
    public record ResendVerificationRequest(@Email @NotBlank String email) {}
    public record MessageResponse(String message) {}

    public record ErrorResponse(String message) {}
}