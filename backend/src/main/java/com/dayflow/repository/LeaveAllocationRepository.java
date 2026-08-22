package com.dayflow.repository;

import com.dayflow.model.LeaveAllocation;
import com.dayflow.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaveAllocationRepository extends JpaRepository<LeaveAllocation, Long> {

    List<LeaveAllocation> findByEmployeeId(String employeeId);

    Optional<LeaveAllocation> findByEmployeeIdAndLeaveType(
            String employeeId, LeaveRequest.LeaveType leaveType);
}