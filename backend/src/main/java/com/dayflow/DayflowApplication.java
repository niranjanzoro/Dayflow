package com.dayflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Dayflow HRMS - Backend entry point.
 * Owner: M2
 *
 * Boots the Spring context. All packages under com.dayflow
 * (config, security, model, repository, service, controller)
 * are component-scanned automatically from this root class.
 */
@SpringBootApplication
@EnableAsync
public class DayflowApplication {

    public static void main(String[] args) {
        SpringApplication.run(DayflowApplication.class, args);
    }

}