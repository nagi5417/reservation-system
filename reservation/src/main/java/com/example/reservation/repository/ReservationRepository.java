package com.example.reservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.reservation.dto.ReservationResponse;
import com.example.reservation.entity.Reservation;
import com.example.reservation.entity.ReservationStatus;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    
    // ユーザーIDとステータスで予約を検索
    List<Reservation> findByUserIdAndStatus(
        Long userId,
        ReservationStatus status
    );

    // ユーザーIDで予約を検索（作成日時の降順）
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);

    // ユーザーIDで予約を検索（スロット開始時刻の降順）
    List<Reservation> findByUserIdOrderBySlot_StartTimeDesc(Long userId);

    // 予約枠IDとユーザーIDとステータスで予約を検索
    Optional<Reservation> findBySlotIdAndUserIdAndStatus(
        Long slotId,
        Long userId,
        ReservationStatus status
    );

    // 予約枠IDとステータスで予約数をカウント
    long countBySlotIdAndStatus(Long slotId, ReservationStatus status);

    // 予約枠IDとユーザーIDとステータスで予約が存在するかチェック（重複予約防止用）
    boolean existsBySlotIdAndUserIdAndStatus(Long slotId, Long userId, ReservationStatus status);

    // 全予約を開始時刻の降順で取得（スタッフ用）
    List<Reservation> findAllByOrderBySlot_StartTimeDesc();
}
