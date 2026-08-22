package com.dayflow.repository;

import com.dayflow.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Attendance - owned by M2.
 *
 * findByEmployeeIdAndDate() backs the check-in/check-out duplicate guard
 * (only one attendance row per employee per day).
 * findByEmployeeIdOrderByDateDesc() backs GET /api/attendance/me
 * (daily/weekly filtering done in the service layer on top of this).
 * findByEmployeeId() (with optional filter) backs GET /api/attendance (HR).
 */
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployeeIdAndDate(String employeeId, LocalDate date);

    List<Attendance> findByEmployeeIdOrderByDateDesc(String employeeId);

    List<Attendance> findByEmployeeIdAndDateBetweenOrderByDateDesc(
            String employeeId, LocalDate startDate, LocalDate endDate);

    List<Attendance> findByDate(LocalDate date);

    List<Attendance> findByEmployeeIdAndDateOrderByDateDesc(String employeeId, LocalDate date);
}