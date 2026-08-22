package com.dayflow.service;

import com.dayflow.model.LeaveRequest;
import com.dayflow.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Owned by M3.
 * Core leave workflow: submit -> PENDING, then HR approves/rejects.
 *
 * Hour 2: submit + status transitions.
 * Hour 4 (this pass): overlap validation on submit.
 * Record-level access rules land in Hour 5, approval timestamp/comment
 * polish in Hour 6 — see §5.
 */
@Service
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;

    @Autowired
    public LeaveService(LeaveRequestRepository leaveRequestRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
    }

    /**
     * Submit a new leave request on behalf of the given employee.
     * employeeId is passed in from the controller, which reads it from the
     * authenticated JWT — never trust a client-supplied employeeId here.
     *
     * Rejects the request if it overlaps an existing PENDING or APPROVED
     * leave for the same employee (Hour 4 — overlap validation).
     */
    public LeaveRequest submit(String employeeId, LeaveRequest.LeaveType leaveType,
                                java.time.LocalDate startDate, java.time.LocalDate endDate,
                                String remarks) {
        if (startDate == null || endDate == null || endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("endDate must not be before startDate");
        }
        if (hasOverlap(employeeId, startDate, endDate)) {
            throw new IllegalStateException(
                    "This leave request overlaps an existing pending or approved leave");
        }

        LeaveRequest request = new LeaveRequest();
        request.setEmployeeId(employeeId);
        request.setLeaveType(leaveType);
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        request.setRemarks(remarks);
        request.setStatus(LeaveRequest.LeaveStatus.PENDING);
        return leaveRequestRepository.save(request);
    }

    /**
     * True if the given employee already has a PENDING or APPROVED leave
     * whose date range intersects [startDate, endDate].
     */
    private boolean hasOverlap(String employeeId, java.time.LocalDate startDate,
                                java.time.LocalDate endDate) {
        List<LeaveRequest> candidates = leaveRequestRepository
                .findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                        employeeId, endDate, startDate);
        return candidates.stream().anyMatch(existing ->
                existing.getStatus() == LeaveRequest.LeaveStatus.PENDING
                        || existing.getStatus() == LeaveRequest.LeaveStatus.APPROVED);
    }

    /** GET /api/leave/me */
    public List<LeaveRequest> findByEmployeeId(String employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId);
    }

    /** GET /api/leave (HR) */
    public List<LeaveRequest> findAll() {
        return leaveRequestRepository.findAll();
    }

    /** PUT /api/leave/{id}/approve (HR) */
    public LeaveRequest approve(Long id, String hrEmployeeId, String adminComment) {
        LeaveRequest request = getOrThrow(id);
        request.setStatus(LeaveRequest.LeaveStatus.APPROVED);
        request.setAdminComment(adminComment);
        request.setApprovedBy(hrEmployeeId);
        request.setActionDate(LocalDateTime.now());
        return leaveRequestRepository.save(request);
    }

    /** PUT /api/leave/{id}/reject (HR) */
    public LeaveRequest reject(Long id, String hrEmployeeId, String adminComment) {
        LeaveRequest request = getOrThrow(id);
        request.setStatus(LeaveRequest.LeaveStatus.REJECTED);
        request.setAdminComment(adminComment);
        request.setApprovedBy(hrEmployeeId);
        request.setActionDate(LocalDateTime.now());
        return leaveRequestRepository.save(request);
    }

    private LeaveRequest getOrThrow(Long id) {
        return leaveRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found: " + id));
    }
}