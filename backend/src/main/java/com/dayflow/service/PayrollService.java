package com.dayflow.service;

import com.dayflow.model.Payroll;
import com.dayflow.repository.PayrollRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Owned by M3.
 * Core payroll logic. netSalary is always recomputed server-side —
 * never trust a client-supplied value for it.
 *
 * Hour 2: read + update, with netSalary computed on write.
 * Hour 4 (this pass): input validation on the update path.
 * Record-level access rules land in Hour 5 — see §5.
 */
@Service
public class PayrollService {

    private final PayrollRepository payrollRepository;

    @Autowired
    public PayrollService(PayrollRepository payrollRepository) {
        this.payrollRepository = payrollRepository;
    }

    /** GET /api/payroll/me */
    public Optional<Payroll> findByEmployeeId(String employeeId) {
        return payrollRepository.findFirstByEmployeeIdOrderByPayPeriodDesc(employeeId);
    }

    /** GET /api/payroll (HR) */
    public List<Payroll> findAll() {
        return payrollRepository.findAll();
    }

    /**
     * PUT /api/payroll/{id} (HR)
     * Applies HR-editable fields, then recomputes netSalary server-side.
     */
    public Payroll update(Long id, Double basicSalary, Double allowances, Double deductions,
                           String payPeriod, Payroll.PayrollStatus status) {
        validate(basicSalary, allowances, deductions, payPeriod);
        Payroll payroll = getOrThrow(id);
        payroll.setBasicSalary(basicSalary);
        payroll.setAllowances(allowances);
        payroll.setDeductions(deductions);
        payroll.setPayPeriod(payPeriod);
        payroll.setStatus(status);
        payroll.setNetSalary(computeNetSalary(basicSalary, allowances, deductions));
        return payrollRepository.save(payroll);
    }

    /** Hour 4 — reject obviously invalid HR input before it hits the DB. */
    private void validate(Double basicSalary, Double allowances, Double deductions, String payPeriod) {
        if (basicSalary == null || basicSalary < 0) {
            throw new IllegalArgumentException("basicSalary must be a non-negative number");
        }
        if (allowances != null && allowances < 0) {
            throw new IllegalArgumentException("allowances must not be negative");
        }
        if (deductions != null && deductions < 0) {
            throw new IllegalArgumentException("deductions must not be negative");
        }
        if (payPeriod == null || !payPeriod.matches("\\d{4}-\\d{2}")) {
            throw new IllegalArgumentException("payPeriod must be in \"YYYY-MM\" format");
        }
    }

    private double computeNetSalary(Double basicSalary, Double allowances, Double deductions) {
        double basic = basicSalary != null ? basicSalary : 0.0;
        double allow = allowances != null ? allowances : 0.0;
        double deduct = deductions != null ? deductions : 0.0;
        return basic + allow - deduct;
    }

    private Payroll getOrThrow(Long id) {
        return payrollRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payroll record not found: " + id));
    }
}