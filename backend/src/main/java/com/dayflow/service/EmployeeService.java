package com.dayflow.service;

import com.dayflow.model.Employee;
import com.dayflow.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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