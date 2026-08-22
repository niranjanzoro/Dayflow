package com.dayflow.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Owned by M3. [NEW — added in the wireframe scope update, §4.4a]
 *
 * The HR-configured salary template for one employee — replaces the flat
 * basicSalary/allowances/deductions fields that used to live directly on
 * Payroll. Payroll is now GENERATED from this structure (see PayrollService,
 * built in Hour 7) rather than edited directly.
 *
 * One SalaryStructure per employee (enforced at the service layer, not the
 * DB, to keep this simple for the hackathon).
 *
 * References SalaryComponent, created as the next file — this class won't
 * compile standalone until that file exists.
 */
@Entity
@Table(name = "salary_structures")
public class SalaryStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK reference to Employee.employeeId — one structure per employee
    @Column(nullable = false, unique = true)
    private String employeeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WageType wageType;

    // Monthly wage if wageType == MONTHLY, hourly rate if wageType == HOURLY
    @Column(nullable = false)
    private Double fixedWage;

    // Basic, HRA, Standard Allowance, Performance Bonus, Loan, Travel
    // Allowance, Fixed Allowance — each with its own computation rule.
    // See PayrollService (Hour 7) for the two-pass resolution order:
    // wage-relative components first, then basic-relative components.
    @ElementCollection
    @CollectionTable(
            name = "salary_structure_components",
            joinColumns = @JoinColumn(name = "salary_structure_id")
    )
    private List<SalaryComponent> components = new ArrayList<>();

    // Provident Fund contribution percentages
    @Column(nullable = false)
    private Double pfEmployerPercent = 12.0;

    @Column(nullable = false)
    private Double pfEmployeePercent = 12.0;

    // Fixed deduction amount
    @Column(nullable = false)
    private Double professionalTax = 200.0;

    public SalaryStructure() {
    }

    // --- Getters and setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmployeeId() {
        return employeeId;
    }

    public void setEmployeeId(String employeeId) {
        this.employeeId = employeeId;
    }

    public WageType getWageType() {
        return wageType;
    }

    public void setWageType(WageType wageType) {
        this.wageType = wageType;
    }

    public Double getFixedWage() {
        return fixedWage;
    }

    public void setFixedWage(Double fixedWage) {
        this.fixedWage = fixedWage;
    }

    public List<SalaryComponent> getComponents() {
        return components;
    }

    public void setComponents(List<SalaryComponent> components) {
        this.components = components;
    }

    public Double getPfEmployerPercent() {
        return pfEmployerPercent;
    }

    public void setPfEmployerPercent(Double pfEmployerPercent) {
        this.pfEmployerPercent = pfEmployerPercent;
    }

    public Double getPfEmployeePercent() {
        return pfEmployeePercent;
    }

    public void setPfEmployeePercent(Double pfEmployeePercent) {
        this.pfEmployeePercent = pfEmployeePercent;
    }

    public Double getProfessionalTax() {
        return professionalTax;
    }

    public void setProfessionalTax(Double professionalTax) {
        this.professionalTax = professionalTax;
    }

    // --- Nested enum (§4.0 Global Enums) ---

    public enum WageType {
        MONTHLY, HOURLY
    }
}