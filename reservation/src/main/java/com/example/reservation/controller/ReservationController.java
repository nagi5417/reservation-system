package com.example.reservation.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.reservation.dto.ReservationRequest;
import com.example.reservation.dto.ReservationResponse;
import com.example.reservation.security.CustomUserDetails;
import com.example.reservation.service.ReservationService;

import jakarta.validation.Valid;

/**
 * 予約管理のREST APIエンドポイントを提供するコントローラークラス。
 *
 * このコントローラーは以下の機能を提供します：
 * ・予約の作成（Googleカレンダー連携あり）
 * ・ユーザー別の予約一覧取得
 * ・特定の予約の詳細取得
 * ・予約のキャンセル（Googleカレンダー連携あり）
 */
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    /**
     * 新しい予約を作成し、Googleカレンダーにイベントを登録します。
     *
     * ユーザーがスロットを予約する際に使用されます。
     * 予約成功時、自動的にGoogleカレンダーにイベントが作成されます。
     *
     * @param request 予約作成リクエスト
     * @param userDetails ログイン中のユーザー情報（Spring Securityから自動注入）
     * @return 作成された予約の情報を含むレスポンス（ステータス：201）
     */
    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(
        @Valid @RequestBody ReservationRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails.getUser().getId();

        ReservationResponse response = reservationService.createReservation(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 指定されたユーザーIDに紐づく予約一覧を取得します。
     *
     * ユーザーが自分の予約履歴を確認する際に使用されます。
     * 予約は開始時刻の降順（新しい順）でソートされます。
     *
     * @param userId ユーザーID
     * @return ユーザーの予約一覧（ステータス：200）
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReservationResponse>> getReservationsByUserId(
        @PathVariable Long userId
    ) {
        List<ReservationResponse> responses = reservationService.getReservationsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 現在ログインしているユーザーの予約一覧を取得します。
     *
     * @param userDetails ログイン中のユーザー情報（Spring Securityから自動注入）
     * @return ログインユーザーの予約一覧（ステータス：200）
     */
    @GetMapping("/my")
    public ResponseEntity<List<ReservationResponse>> getMyReservations(
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails.getUser().getId();
        List<ReservationResponse> responses = reservationService.getReservationsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 指定されたIDの予約の詳細を取得します。
     *
     * 特定の予約の詳細情報を表示する際に使用されます。
     *
     * @param id 予約ID
     * @return 予約の詳細情報を含むレスポンス（ステータス：200）
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReservationResponse> getReservationById(@PathVariable Long id) {
        ReservationResponse response = reservationService.getReservationById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 指定されたIDの予約をキャンセルし、Googleカレンダーからイベントを削除します。
     *
     * ユーザーが予約をキャンセルする際に使用されます。
     * キャンセル成功時、自動的にGoogleカレンダーからイベントが削除されます。
     *
     * @param id 予約ID
     * @param userDetails ログイン中のユーザー情報（Spring Securityから自動注入）
     * @return レスポンスボディなし（ステータス：204）
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelReservation(
        @PathVariable Long id,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails.getUser().getId();

        reservationService.cancelReservation(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponse>> getAllReservations() {
        List<ReservationResponse> responses = reservationService.getAllReservations();
        return ResponseEntity.ok(responses);
    }
}