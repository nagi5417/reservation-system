package com.example.reservation.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SlotRequest {

    @NotNull(message = "サービスメニューIDは必須です")
    private Long serviceMenuId;

    @NotNull(message = "開始時刻は必須です")
    private LocalDateTime startTime;

    @NotNull(message = "終了時刻は必須です")
    private LocalDateTime endTime;

    @NotNull(message = "収容人数は必須です")
    @Min(value = 1, message = "収容人数は1以上である必要があります")
    private Integer capacity;
}