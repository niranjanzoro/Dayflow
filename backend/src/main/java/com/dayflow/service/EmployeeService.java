package com.dayflow.service;

import com.dayflow.model.Employee;
import com.dayflow.model.LeaveAllocation;
import com.dayflow.model.LeaveRequest;
import com.dayflow.model.Role;
import com.dayflow.repository.EmployeeRepository;
import com.dayflow.repository.LeaveAllocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * EmployeeService — owned by M2.
 *
 * getMyProfile / updateMyProfile back GET/PUT /api/employees/me — the caller
 * passes the employeeId read off the JWT principal in the controller
 * (JwtFilter sets employeeId as the SecurityContext principal, file 10/16).
 *
 * getAllEmployees / updateEmployee back the HR-only endpoints; SecurityConfig
 * (file 11/16) already restricts these routes to ROLE_HR, so this layer
 * doesn't need to re-check role — but Hour 6 adds a record-level check so an
 * employee can never update anyone's record but their own via /me.
 */
@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private LeaveAllocationRepository leaveAllocationRepository;

    // Default annual entitlements granted on HR approval - mirrors the
    // mock-mode seeding (casual 12 / sick 8 / earned 15) so both modes of
    // the app show identical balances.
    private static final double PAID_DAYS = 12;
    private static final double SICK_DAYS = 8;
    private static final double EARNED_DAYS = 15;

    public Employee getMyProfile(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new NoSuchElementException("Employee not found: " + employeeId));
    }

    // Employee can only self-edit phone, address, profilePicture (§4.1 "Who can edit" column)
    public Employee updateMyProfile(String employeeId, Employee updates) {
        Employee existing = getMyProfile(employeeId);

        if (updates.getPhone() != null) existing.setPhone(updates.getPhone());
        if (updates.getAddress() != null) existing.setAddress(updates.getAddress());
        if (updates.getProfilePicture() != null) existing.setProfilePicture(updates.getProfilePicture());

        return employeeRepository.save(existing);
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Employee not found: id=" + id));
    }

    public Employee setStatus(Long id, String status) {
        Employee employee = getEmployee(id);
        employee.setStatus(status);
        Employee saved = employeeRepository.save(employee);
        if ("ACTIVE".equals(status)) {
            seedLeaveAllocations(saved);
        }
        return saved;
    }

    /**
     * First activation (HR approval) grants the standard leave entitlements.
     * Idempotent - existing allocations are never overwritten, so
     * deactivate/reactivate cycles don't reset balances.
     */
    private void seedLeaveAllocations(Employee employee) {
        LocalDate now = LocalDate.now();
        LocalDate yearEnd = now.plusYears(1);
        seedIfAbsent(employee, LeaveRequest.LeaveType.PAID, PAID_DAYS, now, yearEnd);
        seedIfAbsent(employee, LeaveRequest.LeaveType.SICK, SICK_DAYS, now, yearEnd);
        seedIfAbsent(employee, LeaveRequest.LeaveType.UNPAID, EARNED_DAYS, now, yearEnd);
    }

    private void seedIfAbsent(Employee employee, LeaveRequest.LeaveType type,
                              double days, LocalDate from, LocalDate to) {
        if (leaveAllocationRepository.findByEmployeeIdAndLeaveType(
                employee.getEmployeeId(), type).isEmpty()) {
            LeaveAllocation allocation = new LeaveAllocation();
            allocation.setEmployeeId(employee.getEmployeeId());
            allocation.setLeaveType(type);
            allocation.setTotalDays(days);
            allocation.setUsedDays(0.0);
            allocation.setValidityStart(from);
            allocation.setValidityEnd(to);
            allocation.setAllocatedBy("SYSTEM");
            leaveAllocationRepository.save(allocation);
        }
    }

    public Employee setRole(Long id, Role role) {
        Employee employee = getEmployee(id);
        employee.setRole(role);
        return employeeRepository.save(employee);
    }

    // HR can edit all fields except password (§4.1)
    public Employee updateEmployee(Long id, Employee updates) {
        Employee existing = employeeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Employee not found: id=" + id));

        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getRole() != null) existing.setRole(updates.getRole());
        if (updates.getPhone() != null) existing.setPhone(updates.getPhone());
        if (updates.getAddress() != null) existing.setAddress(updates.getAddress());
        if (updates.getProfilePicture() != null) existing.setProfilePicture(updates.getProfilePicture());
        if (updates.getJobTitle() != null) existing.setJobTitle(updates.getJobTitle());
        if (updates.getDepartment() != null) existing.setDepartment(updates.getDepartment());
        if (updates.getJoiningDate() != null) existing.setJoiningDate(updates.getJoiningDate());
        // employeeId, email, password intentionally never touched here

        return employeeRepository.save(existing);
    }
}