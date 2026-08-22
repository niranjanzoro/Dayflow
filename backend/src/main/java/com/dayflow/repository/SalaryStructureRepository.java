package com.dayflow.repository;

import com.dayflow.model.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Owned by M3. [NEW — added in the wireframe scope update, §4.4a]
 *
 * Data access for SalaryStructure. One structure per employee (enforced by
 * the unique constraint on SalaryStructure.employeeId), so lookups return
 * Optional rather than a list.
 *
 * Supports:
 *  - GET /api/payroll/salary-structure/{employeeId} (HR) -> findByEmployeeId
 *  - PUT /api/payroll/salary-structure/{employeeId} (HR) -> findByEmployeeId, then save
 *  - PayrollService.generate() (Hour 7) -> findByEmployeeId, to compute a payslip from
 */
public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {

    Optional<SalaryStructure> findByEmployeeId(String employeeId);
}