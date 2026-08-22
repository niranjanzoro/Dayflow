package com.dayflow.repository;

import com.dayflow.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository for Employee - owned by M2.
 *
 * findByEmail() backs login (AuthController reads username=email).
 * findByEmployeeId() is used wherever the JWT's employeeId claim needs
 * to be resolved to a full Employee record (e.g. AttendanceService).
 */
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmail(String email);

    Optional<Employee> findByEmployeeId(String employeeId);

    boolean existsByEmail(String email);

    boolean existsByEmployeeId(String employeeId);
}