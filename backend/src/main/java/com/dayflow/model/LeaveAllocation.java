package com.dayflow.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "leave_allocations")
public class LeaveAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String employeeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveRequest.LeaveType leaveType;

    @Column(nullable = false)
    private Double totalDays;

    @Column(nullable = false)
    private Double usedDays = 0.0;

    @Column(nullable = false)
    private LocalDate validityStart;

    @Column(nullable = false)
    private LocalDate validityEnd;

    @Column(nullable = false)
    private String allocatedBy;

    public LeaveAllocation() {
    }

    @Transient
    public Double getRemainingDays() {
        double total = totalDays != null ? totalDays : 0.0;
        double used = usedDays != null ? usedDays : 0.0;
        return total - used;
    }

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

    public LeaveRequest.LeaveType getLeaveType() {
        return leaveType;
    }

    public void setLeaveType(LeaveRequest.LeaveType leaveType) {
        this.leaveType = leaveType;
    }

    public Double getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Double totalDays) {
        this.totalDays = totalDays;
    }

    public Double getUsedDays() {
        return usedDays;
    }

    public void setUsedDays(Double usedDays) {
        this.usedDays = usedDays;
    }

    public LocalDate getValidityStart() {
        return validityStart;
    }

    public void setValidityStart(LocalDate validityStart) {
        this.validityStart = validityStart;
    }

    public LocalDate getValidityEnd() {
        return validityEnd;
    }

    public void setValidityEnd(LocalDate validityEnd) {
        this.validityEnd = validityEnd;
    }

    public String getAllocatedBy() {
        return allocatedBy;
    }

    public void setAllocatedBy(String allocatedBy) {
        this.allocatedBy = allocatedBy;
    }
}