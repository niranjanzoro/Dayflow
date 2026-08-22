package com.dayflow.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/**
 * Owned by M3. [NEW — added in the wireframe scope update, §4.4b]
 *
 * One line item in a SalaryStructure's component list — e.g.
 * { type: BASIC, computationType: PERCENT_OF_WAGE, value: 60 }
 * { type: HRA, computationType: PERCENT_OF_BASIC, value: 40 }
 *
 * @Embeddable rather than its own @Entity: components have no independent
 * identity or lifecycle outside their parent SalaryStructure, and this
 * keeps the schema simple for the hackathon (no extra FK/repository needed —
 * SalaryStructure's @ElementCollection handles persistence).
 *
 * Resolution order (see PayrollService, built in Hour 7):
 *   1. Resolve BASIC and any PERCENT_OF_WAGE component from fixedWage.
 *   2. Resolve any PERCENT_OF_BASIC component from the now-known Basic value.
 *   3. Apply FIXED_AMOUNT components as-is.
 * Two passes is enough for this hackathon's scope — don't build a general
 * dependency graph resolver, there isn't time.
 */
@Embeddable
public class SalaryComponent {

    @Enumerated(EnumType.STRING)
    private SalaryComponentType type;

    @Enumerated(EnumType.STRING)
    private ComputationType computationType;

    // Amount (if FIXED_AMOUNT) or percentage (if PERCENT_OF_WAGE / PERCENT_OF_BASIC)
    private Double value;

    public SalaryComponent() {
    }

    public SalaryComponent(SalaryComponentType type, ComputationType computationType, Double value) {
        this.type = type;
        this.computationType = computationType;
        this.value = value;
    }

    // --- Getters and setters ---

    public SalaryComponentType getType() {
        return type;
    }

    public void setType(SalaryComponentType type) {
        this.type = type;
    }

    public ComputationType getComputationType() {
        return computationType;
    }

    public void setComputationType(ComputationType computationType) {
        this.computationType = computationType;
    }

    public Double getValue() {
        return value;
    }

    public void setValue(Double value) {
        this.value = value;
    }

    // --- Nested enums (§4.0 Global Enums) ---

    public enum SalaryComponentType {
        BASIC, HRA, STANDARD_ALLOWANCE, PERFORMANCE_BONUS, LOAN, TRAVEL_ALLOWANCE, FIXED_ALLOWANCE
    }

    public enum ComputationType {
        FIXED_AMOUNT, PERCENT_OF_WAGE, PERCENT_OF_BASIC
    }
}