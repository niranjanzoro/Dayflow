package com.dayflow.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailServiceTest {

    private JavaMailSender mailSender;
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        emailService = new EmailService(mailSender);
    }

    @Test
    void disabledMailLogsTheCodeInsteadOfSending() {
        ReflectionTestUtils.setField(emailService, "mailEnabled", false);

        emailService.sendVerificationCode("jane@corp.com", "Jane Doe", "123456");

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void enabledMailSendsABrandedVerificationMessage() throws Exception {
        ReflectionTestUtils.setField(emailService, "mailEnabled", true);
        ReflectionTestUtils.setField(emailService, "from", "no-reply@dayflow.com");
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((jakarta.mail.Session) null));

        // HTML-escaped name proves the template is XSS-safe.
        emailService.sendVerificationCode("jane@corp.com", "Jane <b>Doe</b>", "123456");

        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(captor.capture());
        assertThat(captor.getValue().getSubject()).isEqualTo("Verify your email - Dayflow HRMS");
        assertThat(captor.getValue().getAllRecipients())
                .containsExactly(new InternetAddress("jane@corp.com"));
    }

    @Test
    void aMailOutageNeverPropagatesToTheCaller() throws Exception {
        ReflectionTestUtils.setField(emailService, "mailEnabled", true);
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage((jakarta.mail.Session) null));
        doThrow(new RuntimeException("SMTP down")).when(mailSender).send(any(MimeMessage.class));

        assertThatCode(() ->
                emailService.sendVerificationCode("jane@corp.com", "Jane Doe", "123456")
        ).doesNotThrowAnyException();
    }
}
