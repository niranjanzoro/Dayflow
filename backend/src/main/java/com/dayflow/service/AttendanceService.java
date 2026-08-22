package com.dayflow.service;

import com.dayflow.model.Attendance;
import com.dayflow.model.Attendance.AttendanceStatus;
import com.dayflow.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * AttendanceService — owned by M2.
 *
 * checkIn / checkOut back POST /api/attendance/checkin and /checkout.
 * One Attendance row per employee per calendar day — checkIn creates it,
 * checkOut fills in the rest and computes workingHours.
 *
 * getMyAttendance backs GET /api/attendance/me (self, any date range).
 * getAttendanceByDate backs GET /api/attendance (HR-only, per SecurityConfig).
 */
@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    public Attendance checkIn(String employeeId) {
        LocalDate today = LocalDate.now();

        attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .ifPresent(a -> {
                    throw new IllegalStateException("Already checked in today");
                });

        Attendance attendance = new Attendance();
        attendance.setEmployeeId(employeeId);
        attendance.setDate(today);
        attendance.setCheckIn(LocalDateTime.now());
        attendance.setStatus(AttendanceStatus.PRESENT);

        return attendanceRepository.save(attendance);
    }

    public Attendance checkOut(String employeeId) {
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeIdAndDate(employeeId, today)
                .orElseThrow(() -> new IllegalStateException("No check-in found for today"));

        if (attendance.getCheckOut() != null) {
            throw new IllegalStateException("Already checked out today");
        }

        LocalDateTime now = LocalDateTime.now();
        attendance.setCheckOut(now);
        attendance.setWorkingHours(computeWorkingHours(attendance.getCheckIn(), now));

        // Under 4 hours logged counts as a half day — a reasonable hackathon-scope rule
        if (attendance.getWorkingHours() < 4.0) {
            attendance.setStatus(AttendanceStatus.HALF_DAY);
        }

        return attendanceRepository.save(attendance);
    }

    public List<Attendance> getMyAttendance(String employeeId, LocalDate start, LocalDate end) {
        if (start != null && end != null) {
            return attendanceRepository.findByEmployeeIdAndDateBetweenOrderByDateDesc(employeeId, start, end);
        }
        return attendanceRepository.findByEmployeeIdOrderByDateDesc(employeeId);
    }

    public List<Attendance> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByDate(date);
    }

    private double computeWorkingHours(LocalDateTime checkIn, LocalDateTime checkOut) {
        Duration duration = Duration.between(checkIn, checkOut);
        // Rounded to 2 decimal places, e.g. 8.25 hours
        return Math.round((duration.toMinutes() / 60.0) * 100.0) / 100.0;
    }
}