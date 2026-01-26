package com.example.reservation.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long slotId;
    private String serviceMenuName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String notes;
}