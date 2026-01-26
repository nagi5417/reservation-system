package com.example.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ServiceMenuResponse {

    private Long id;
    private String name;
    private String description;
    private Integer durationMinutes;
    private Integer price;
}