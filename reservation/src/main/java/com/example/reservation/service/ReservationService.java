package com.example.reservation.service;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.reservation.entity.User;
import com.example.reservation.entity.Reservation;
import com.example.reservation.entity.ReservationStatus;
import com.example.reservation.entity.Slot;
import com.example.reservation.entity.SlotStatus;
import com.example.reservation.dto.ReservationRequest;
import com.example.reservation.dto.ReservationResponse;
import com.example.reservation.exception.InvalidRequestException;
import com.example.reservation.exception.ResourceNotFoundException;
import com.example.reservation.exception.UnauthorizedException;
import com.example.reservation.repository.ReservationRepository;
import com.example.reservation.repository.SlotRepository;
import com.example.reservation.repository.UserRepository;

/**
 * 予約管理を行うサービスクラス。
 *
 * このクラスは以下の機能を提供する。
 * ・予約の作成（Googleカレンダー連携あり）
 * ・ユーザー別の予約一覧取得
 * ・予約の詳細取得
 * ・予約のキャンセル（Googleカレンダー連携あり）
 */
@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final SlotRepository slotRepository;
    private final GoogleCalendarService googleCalendarService;

    public ReservationService(
        ReservationRepository reservationRepository,
        UserRepository userRepository,
        SlotRepository slotRepository,
        GoogleCalendarService googleCalendarService
    ) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.slotRepository = slotRepository;
        this.googleCalendarService = googleCalendarService;
        }

    /**
     * 新しい予約を作成し、Googleカレンダーにイベントを登録する。
     *
     * @param request 予約リクエスト（スロットID、備考）
     * @param userId 予約するユーザーのID（Spring Securityから取得）
     * @return 作成された予約の情報を含むレスポンス
     * @throws ResourceNotFoundException ユーザーまたはスロットが見つからない場合
     * @throws InvalidRequestException スロットが予約できない状態の場合、24時間前を切っている場合、
     *                                  定員超過の場合、重複予約の場合
     */
    @Transactional
    public ReservationResponse createReservation(ReservationRequest request, Long userId) {
        // ユーザー取得
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません: ID=" + userId));

        // スロット取得
        Slot slot = slotRepository.findById(request.getSlotId())
            .orElseThrow(() -> new ResourceNotFoundException("スロットが見つかりません: ID=" + request.getSlotId()));

        // スロットが予約可能かチェック
        if (slot.getStatus() != SlotStatus.AVAILABLE) {
            throw new InvalidRequestException("このスロットは予約できません: " + slot.getStatus());
        }

        // 24時間前チェック：開始時刻の24時間前を切っていたらエラー
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = slot.getStartTime().minusHours(24);
        if (now.isAfter(deadline)) {
            throw new InvalidRequestException("予約受付は開始24時間前までです");
        }

        // 残席チェック：予約数 >= 定員ならエラー
        long reservedCount = reservationRepository.countBySlotIdAndStatus(
            slot.getId(),
            ReservationStatus.RESERVED
        );
        if (reservedCount >= slot.getCapacity()) {
            throw new InvalidRequestException("満席のため予約できません");
        }

        // 重複予約チェック：同じユーザー×同じ枠にRESERVED予約があればエラー
        boolean alreadyReserved = reservationRepository.existsBySlotIdAndUserIdAndStatus(
            slot.getId(),
            userId,
            ReservationStatus.RESERVED
        );
        if (alreadyReserved) {
            throw new InvalidRequestException("既にこの枠を予約済みです");
        }

        // 予約作成
        Reservation reservation = Reservation.builder()
            .user(user)
            .slot(slot)
            .status(ReservationStatus.RESERVED)
            .notes(request.getNotes())
            .build();

        Reservation savedReservation = reservationRepository.save(reservation);

        // Googleカレンダーイベント作成
        String eventId = googleCalendarService.createEvent(user, savedReservation);

        // eventIdが返された場合は予約に保存
        if (eventId != null) {
            savedReservation.setGoogleCalendarEventId(eventId);
            reservationRepository.save(savedReservation);
        }

        // スロットのステータス管理：予約数がcapacity以上になったらFULLに変更
        long currentReservedCount = reservationRepository.countBySlotIdAndStatus(
            slot.getId(),
            ReservationStatus.RESERVED
        );

        if (currentReservedCount >= slot.getCapacity()) {
            slot.setStatus(SlotStatus.FULL);
            slotRepository.save(slot);
        }

        return convertToResponse(savedReservation);
    }

    /**
     * 指定されたユーザーIDに紐づく予約一覧を取得する。
     * 予約は開始時刻の降順（新しい順）でソートされる。
     * これにより、最新の予約が一覧の先頭に表示される。
     *
     * @param userId ユーザーID
     * @return 予約一覧（開始時刻の降順）。予約がない場合は空のリスト
     */
    public List<ReservationResponse> getReservationsByUserId(Long userId) {
        return reservationRepository.findByUserIdOrderBySlot_StartTimeDesc(userId)
            .stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }

    /**
     * 指定されたIDの予約を取得する。
     * 
     * @param id 予約ID
     * @return 予約の詳細情報
     * @throws ResourceNotFoundException 予約が見つからない場合
     */
    public ReservationResponse getReservationById(Long id) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("予約が見つかりません: ID=" + id));

        return convertToResponse(reservation);
    }

    /**
     * 予約をキャンセルしてGoogleカレンダーからイベントを削除する。
     *
     * @param id 予約ID
     * @param userId キャンセルを試みるユーザーのID（Spring Securityから取得）
     * @throws ResourceNotFoundException 予約が見つからない場合
     * @throws UnauthorizedException 予約したユーザー本人以外がキャンセルを試みた場合
     * @throws InvalidRequestException 既にキャンセル済みの場合、24時間前を切っている場合
     */
    @Transactional
    public void cancelReservation(Long id, Long userId) {
        Reservation reservation = reservationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("予約が見つかりません: ID=" + id));

        // 予約したユーザー本人以外はキャンセルできない
        if (!reservation.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("この予約をキャンセルする権限がありません");
        }

        // ステータスチェック：RESERVED以外はキャンセル不可
        if (reservation.getStatus() != ReservationStatus.RESERVED) {
            throw new InvalidRequestException("この予約は既にキャンセルされています");
        }

        // 24時間前チェック：開始時刻の24時間前を切っていたらエラー
        Slot slot = reservation.getSlot();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = slot.getStartTime().minusHours(24);
        if (now.isAfter(deadline)) {
            throw new InvalidRequestException("開始24時間前を過ぎているためキャンセルできません");
        }

        // 予約のステータスをキャンセルに変更
        reservation.setStatus(ReservationStatus.CANCELLED);
        reservationRepository.save(reservation);

        // Googleカレンダーイベント削除
        String eventId = reservation.getGoogleCalendarEventId();
        if (eventId != null) {
            googleCalendarService.deleteEvent(reservation.getUser(), eventId);
        }

        // スロットのステータスを更新：キャンセル後の予約数を確認
        long reservedCount = reservationRepository.countBySlotIdAndStatus(
            slot.getId(),
            ReservationStatus.RESERVED
        );

        // キャンセル後の予約数がcapacity未満の場合、利用可能に戻す
        if (reservedCount < slot.getCapacity()) {
            slot.setStatus(SlotStatus.AVAILABLE);
            slotRepository.save(slot);
        }
    }

    /**
     * ReservationエンティティをReservationResponse DTOに変換する。
     *
     * エンティティの複数のリレーションから情報を取得し、クライアントに返すためのDTOを構築する。
     *
     * @param reservation Reservationエンティティ
     * @return ReservationResponse DTO
     */
    private ReservationResponse convertToResponse(Reservation reservation) {
        return ReservationResponse.builder()
            .id(reservation.getId())
            .userId(reservation.getUser().getId())
            .userName(reservation.getUser().getName())
            .slotId(reservation.getSlot().getId())
            .serviceMenuName(reservation.getSlot().getServiceMenu().getName())
            .startTime(reservation.getSlot().getStartTime())
            .endTime(reservation.getSlot().getEndTime())
            .status(reservation.getStatus().name())
            .notes(reservation.getNotes())
            .build();

    }

    // すべての予約を取得（スタッフ用）
    public List<ReservationResponse> getAllReservations() {
        List<Reservation> reservations = reservationRepository.findAllByOrderBySlot_StartTimeDesc();

        return reservations.stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
}
