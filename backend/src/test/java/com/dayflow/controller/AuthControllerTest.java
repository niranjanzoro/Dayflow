package com.dayflow.controller;

import com.dayflow.model.Employee;
import com.dayflow.repository.EmployeeRepository;
import com.dayflow.security.JwtUtil;
import com.dayflow.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    private EmployeeRepository repo;
    private StubEncoder encoder;
    private JwtUtil jwtUtil;
    private EmailService emailService;
    private MockMvc mvc;

    /** Deterministic stand-in for BCryptPasswordEncoder (slow by design). */
    static class StubEncoder implements org.springframework.security.crypto.password.PasswordEncoder {
        @Override public String encode(CharSequence raw) { return "hashed:" + raw; }
        @Override public boolean matches(CharSequence raw, String hashed) { return hashed.equals("hashed:" + raw); }
    }

    private Employee employee(String email, String password) {
        Employee e = new Employee();
        e.setId(7L);
        e.setEmployeeId("EMP100001");
        e.setName("Jane Doe");
        e.setEmail(email);
        e.setPassword("hashed:" + password);
        e.setStatus("ACTIVE");
        e.setEmailVerified(true);
        e.setRole(com.dayflow.model.Role.EMPLOYEE);
        return e;
    }

    @BeforeEach
    void setUp() {
        repo = mock(EmployeeRepository.class);
        encoder = new StubEncoder();
        jwtUtil = mock(JwtUtil.class);
        emailService = mock(EmailService.class);
        AuthController controller = new AuthController(repo, encoder, jwtUtil, emailService);
        ReflectionTestUtils.setField(controller, "verificationTtlMinutes", 15);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ---------- POST /api/auth/register ----------

    @Test
    void registerCreatesAccountAndSendsCodeWithoutLeakingIt() throws Exception {
        when(repo.existsByEmail("jane@corp.com")).thenReturn(false);
        when(repo.existsByEmployeeId(anyString())).thenReturn(false);
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Jane Doe","email":"jane@corp.com","password":"Secret#123"}
                            """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value(
                        "Account created. A verification code was sent to jane@corp.com. It expires in 15 minutes."));

        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(repo).save(captor.capture());
        Employee saved = captor.getValue();
        assertThat(saved.getPassword()).isEqualTo("hashed:Secret#123");
        assertThat(saved.getStatus()).isEqualTo("PENDING");
        assertThat(saved.isEmailVerified()).isFalse();
        assertThat(saved.getVerificationCode()).hasSize(6);
        assertThat(saved.getVerificationExpiresAt()).isAfter(LocalDateTime.now());

        // The code travels by email only - never in the HTTP response.
        verify(emailService).sendVerificationCode(eq("jane@corp.com"), eq("Jane Doe"), anyString());
    }

    @Test
    void registerRejectsDuplicateEmailWithConflict() throws Exception {
        when(repo.existsByEmail("taken@corp.com")).thenReturn(true);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"Dup","email":"taken@corp.com","password":"Secret#123"}
                            """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));

        verify(repo, never()).save(any());
    }

    @Test
    void registerRejectsDuplicateEmployeeId() throws Exception {
        when(repo.existsByEmail("new@corp.com")).thenReturn(false);
        when(repo.existsByEmployeeId("EMP100001")).thenReturn(true);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"employeeId":"EMP100001","name":"New","email":"new@corp.com","password":"Secret#123"}
                            """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Employee ID already in use"));
    }

    @Test
    void registerFailsValidationOnBlankFields() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"","email":"not-an-email","password":""}
                            """))
                .andExpect(status().isBadRequest());

        verify(repo, never()).save(any());
    }

    // ---------- POST /api/auth/login ----------

    @Test
    void loginReturnsTokenAndProfileForValidCredentials() throws Exception {
        Employee jane = employee("jane@corp.com", "pw");
        when(repo.findByEmail("jane@corp.com")).thenReturn(Optional.of(jane));
        when(jwtUtil.generateToken(eq("jane@corp.com"), eq("EMP100001"), eq("EMPLOYEE"), eq("Jane Doe")))
                .thenReturn("jwt-token");

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"jane@corp.com","password":"pw"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.user.email").value("jane@corp.com"))
                .andExpect(jsonPath("$.user.role").value("EMPLOYEE"))
                .andExpect(jsonPath("$.user.status").value("ACTIVE"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    void loginRejectsWrongPasswordWithoutRevealingWhichFieldFailed() throws Exception {
        when(repo.findByEmail("jane@corp.com"))
                .thenReturn(Optional.of(employee("jane@corp.com", "real")));
        when(repo.findByEmail("ghost@corp.com")).thenReturn(Optional.empty());

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(""" 
                            {"email":"jane@corp.com","password":"wrong"}
                            """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"ghost@corp.com","password":"whatever"}
                            """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void loginBlocksUnverifiedEmail() throws Exception {
        Employee pending = employee("pending@corp.com", "pw");
        pending.setEmailVerified(false);
        pending.setStatus("PENDING");
        when(repo.findByEmail("pending@corp.com")).thenReturn(Optional.of(pending));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"pending@corp.com","password":"pw"}
                            """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Please verify your email before signing in"));
    }

    @Test
    void loginBlocksVerifiedButNotYetApprovedAccounts() throws Exception {
        // Verified the email, but HR has not approved yet.
        Employee awaiting = employee("awaiting@corp.com", "pw");
        awaiting.setEmailVerified(true);
        awaiting.setStatus("PENDING");
        when(repo.findByEmail("awaiting@corp.com")).thenReturn(Optional.of(awaiting));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"awaiting@corp.com","password":"pw"}
                            """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(
                        "Your account is awaiting HR approval. You will be able to sign in once HR approves it."));

        verify(jwtUtil, never()).generateToken(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void loginBlocksDeactivatedAccount() throws Exception {
        Employee deactivated = employee("out@corp.com", "pw");
        deactivated.setStatus("DEACTIVATED");
        when(repo.findByEmail("out@corp.com")).thenReturn(Optional.of(deactivated));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"out@corp.com","password":"pw"}
                            """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Your account has been deactivated"));
    }

    // ---------- POST /api/auth/verify-email ----------

    @Test
    void verifyEmailConfirmsTheAddressButKeepsAccountPendingForHR() throws Exception {
        Employee pending = employee("pending@corp.com", "pw");
        pending.setEmailVerified(false);
        pending.setStatus("PENDING");
        pending.setVerificationCode("123456");
        pending.setVerificationExpiresAt(LocalDateTime.now().plusMinutes(10));
        when(repo.findByEmail("pending@corp.com")).thenReturn(Optional.of(pending));

        mvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"pending@corp.com","code":"123456"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "Email verified successfully. Your account is awaiting HR approval."));

        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(repo).save(captor.capture());
        assertThat(captor.getValue().isEmailVerified()).isTrue();
        // HR approval is a separate step - verification alone must not activate.
        assertThat(captor.getValue().getStatus()).isEqualTo("PENDING");
        assertThat(captor.getValue().getVerificationCode()).isNull();
    }

    @Test
    void verifyEmailRejectsWrongOrExpiredCode() throws Exception {
        Employee pending = employee("pending@corp.com", "pw");
        pending.setEmailVerified(false);
        pending.setVerificationCode("123456");
        pending.setVerificationExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(repo.findByEmail("pending@corp.com")).thenReturn(Optional.of(pending));

        mvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"pending@corp.com","code":"999999"}
                            """))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/auth/verify-email").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"pending@corp.com","code":"123456"}
                            """))
                .andExpect(status().isBadRequest());

        verify(repo, never()).save(any());
    }

    // ---------- POST /api/auth/resend-verification ----------

    @Test
    void resendForUnknownEmailReturnsGenericSuccess() throws Exception {
        when(repo.findByEmail("nobody@corp.com")).thenReturn(Optional.empty());

        mvc.perform(post("/api/auth/resend-verification").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"nobody@corp.com"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "If that email is registered, a new verification code has been sent."));

        verify(emailService, never()).sendVerificationCode(anyString(), anyString(), anyString());
    }

    @Test
    void resendIssuesFreshCodeForUnverifiedAccount() throws Exception {
        Employee pending = employee("pending@corp.com", "pw");
        pending.setEmailVerified(false);
        pending.setVerificationCode("111111");
        when(repo.findByEmail("pending@corp.com")).thenReturn(Optional.of(pending));

        mvc.perform(post("/api/auth/resend-verification").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"pending@corp.com"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("A new verification code has been sent."));

        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(repo).save(captor.capture());
        assertThat(captor.getValue().getVerificationCode()).hasSize(6);
        verify(emailService).sendVerificationCode(eq("pending@corp.com"), anyString(),
                eq(captor.getValue().getVerificationCode()));
    }

    @Test
    void resendRejectsAlreadyVerifiedEmail() throws Exception {
        when(repo.findByEmail("jane@corp.com"))
                .thenReturn(Optional.of(employee("jane@corp.com", "pw")));

        mvc.perform(post("/api/auth/resend-verification").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"jane@corp.com"}
                            """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already verified"));
    }
}
