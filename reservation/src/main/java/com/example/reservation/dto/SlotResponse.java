package com.example.reservation.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SlotResponse {

    private Long id;
    private Long serviceMenuId;
    private String serviceMenuName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Integer capacity;
    private Integer reservedCount;  // 現在の予約数
    private Integer availableSeats;  // 残席数（capacity - reservedCount）
}