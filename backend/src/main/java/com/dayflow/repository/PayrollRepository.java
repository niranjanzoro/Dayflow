package com.dayflow.repository;

import com.dayflow.model.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Owned by M3.
 * Data access for Payroll. Query methods below support:
 *  - GET /api/payroll/me -> findByEmployeeId
 *  - GET /api/payroll (HR) -> findAll (inherited)
 */
public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    List<Payroll> findByEmployeeId(String employeeId);

    // Convenience for "current" payroll lookups if a single active record
    // per employee is assumed for the hackathon scope.
    Optional<Payroll> findFirstByEmployeeIdOrderByPayPeriodDesc(String employeeId);
}