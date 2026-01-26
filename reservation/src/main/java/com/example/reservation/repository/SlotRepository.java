package com.example.reservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import com.example.reservation.entity.Slot;
import com.example.reservation.entity.SlotStatus;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {
    
    // 開始時刻の範囲で予約枠を検索
    List<Slot> findByStartTimeBetween(
        LocalDateTime startTime,
        LocalDateTime endTime
    );

    // 開始時刻の範囲とステータスで予約枠を検索
    List<Slot> findByStartTimeBetweenAndStatus(
        LocalDateTime startTime,
        LocalDateTime endTime,
        SlotStatus status
    );

    // サービスメニューIDで予約枠を検索
    List<Slot> findByServiceMenuIdOrderByStartTimeAsc(Long serviceMenuId);

    // サービスメニューIDと開始時刻の範囲で予約枠を検索
    List<Slot> findByServiceMenuIdAndStartTimeBetween(
        Long serviceMenuId,
        LocalDateTime startTime,
        LocalDateTime endTime
    );
}
