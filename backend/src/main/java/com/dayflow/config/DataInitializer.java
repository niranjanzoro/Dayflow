package com.dayflow.config;

import com.dayflow.model.Employee;
import com.dayflow.model.Role;
import com.dayflow.repository.EmployeeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedDemoAccounts(EmployeeRepository repository, PasswordEncoder encoder) {
        return args -> {
            if (repository.existsByEmail("admin@dayflow.com")) return;

            Employee hr = new Employee();
            hr.setEmployeeId("EMP0001");
            hr.setName("Ava Fontaine");
            hr.setEmail("admin@dayflow.com");
            hr.setPassword(encoder.encode("Admin@123"));
            hr.setRole(Role.HR);
            hr.setStatus("ACTIVE");
            hr.setEmailVerified(true);
            hr.setDepartment("Human Resources");
            hr.setJobTitle("HR Manager");
            repository.save(hr);

            Employee employee = new Employee();
            employee.setEmployeeId("EMP0002");
            employee.setName("Rahul Mehta");
            employee.setEmail("rahul.mehta@dayflow.com");
            employee.setPassword(encoder.encode("Employee@123"));
            employee.setRole(Role.EMPLOYEE);
            employee.setStatus("ACTIVE");
            employee.setEmailVerified(true);
            employee.setDepartment("Engineering");
            employee.setJobTitle("Software Engineer");
            repository.save(employee);
        };
    }
}
