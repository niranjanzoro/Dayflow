package com.dayflow.repository;

import com.dayflow.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

/**
 * Owned by M3.
 * Data access for LeaveRequest. Query methods below support:
 *  - GET /api/leave/me  -> findByEmployeeId
 *  - GET /api/leave (HR) -> findAll (inherited)
 *  - overlap validation (Hour 4) -> findByEmployeeIdAndDateRangeOverlap
 */
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByEmployeeId(String employeeId);

    List<LeaveRequest> findByStatus(LeaveRequest.LeaveStatus status);

    // Used in Hour 4 for overlap validation: any existing PENDING/APPROVED
    // leave for this employee whose range intersects [startDate, endDate].
    List<LeaveRequest> findByEmployeeIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            String employeeId, LocalDate endDate, LocalDate startDate);
}