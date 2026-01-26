package com.example.reservation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class ServiceMenuRequest {

    @NotBlank(message = "サービス名は必須です")
    private String name;

    private String description;

    @NotNull(message = "所要時間は必須です")
    @Min(value = 1, message = "所要時間は1分以上である必要があります")
    private Integer durationMinutes;

    @NotNull(message = "料金は必須です")
    @Min(value = 0, message = "料金は0円以上である必要があります")
    private Integer price;
}