package com.example.reservation.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.reservation.dto.SlotRequest;
import com.example.reservation.dto.SlotResponse;
import com.example.reservation.service.SlotService;

import jakarta.validation.Valid;

/**
 * 予約枠（スロット）管理のREST APIエンドポイントを提供するコントローラークラス。
 *
 * このコントローラーは以下の機能を提供します：
 * ・スロットの新規作成
 * ・特定のスロットの取得
 * ・日付範囲でスロットを検索
 * ・スロットの更新
 * ・スロットの削除
 */
@RestController
@RequestMapping("/api/slots")
public class SlotController {

    private final SlotService slotService;

    public SlotController(SlotService slotService) {
        this.slotService = slotService;
    }

    /**
     * 新しい予約枠（スロット）を作成します。
     *
     * 管理者が予約可能なスロットを作成する際に使用されます。
     * 作成されたスロットは初期状態でAVAILABLE（予約可能）となります。
     *
     * @param request スロット作成リクエスト
     * @return 作成されたスロットの情報を含むレスポンス（ステータス：201）
     */
    @PostMapping
    public ResponseEntity<SlotResponse> createSlot(
        @Valid @RequestBody SlotRequest request
    ) {
        SlotResponse response = slotService.createSlot(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 指定されたIDのスロットを取得します。
     *
     * 特定のスロットの詳細を表示する際に使用されます。
     *
     * @param id スロットID
     * @return スロットの詳細情報を含むレスポンス（ステータス：200）
     */
    @GetMapping("/{id}")
    public ResponseEntity<SlotResponse> getSlotById(@PathVariable Long id) {
        SlotResponse response = slotService.getSlotById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 指定されたIDのスロットを更新します。
     *
     * 管理者がスロットの情報を更新する際に使用されます。
     *
     * @param id スロットID
     * @param request スロット更新リクエスト
     * @return 更新されたスロットの情報を含むレスポンス（ステータス：200）
     */
    @PutMapping("/{id}")
    public ResponseEntity<SlotResponse> updateSlot(
        @PathVariable Long id,
        @Valid @RequestBody SlotRequest request
    ) {
        SlotResponse response = slotService.updateSlot(id, request);
        return ResponseEntity.ok(response);
    }

    /**
       * すべてのスロットを取得します（条件付きフィルタリング可能）。
       *
       * すべてのパラメータはオプショナルです。
       * パラメータなしの場合は全スロットを返します。
       *
       * @param from 検索開始時刻（オプショナル）
       * @param to 検索終了時刻（オプショナル）
       * @param menuId サービスメニューID（オプショナル）
       * @return 条件に一致するスロットのリスト（ステータス：200）
       */
    @GetMapping
    public ResponseEntity<List<SlotResponse>> getAllSlots(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
        @RequestParam(required = false) Long menuId
    ) {
        List<SlotResponse> responses = slotService.getAllSlots(from, to, menuId);
        return ResponseEntity.ok(responses);
    }

    /**
     * 指定された日付範囲内のスロットを検索します。
     *
     * ユーザーが予約可能なスロットを検索する際に使用されます。
     * 開始時刻と終了時刻の範囲内にあるスロットがすべて返されます。
     *
     * @param startTime 検索範囲の開始時刻
     * @param endTime 検索範囲の終了時刻
     * @return 検索条件に一致するスロットのリスト（ステータス：200）
     */
    @GetMapping("/search")
    public ResponseEntity<List<SlotResponse>> getSlotsByDateRange(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime
    ) {
        List<SlotResponse> responses = slotService.getSlotsByDateRange(startTime, endTime);
        return ResponseEntity.ok(responses);
    }

    /**
     * 指定されたIDのスロットを削除します。
     *
     * 管理者がスロットを削除する際に使用されます。
     * 削除成功時はレスポンスボディを返さず、204 No Contentを返します。
     *
     * @param id スロットID
     * @return レスポンスボディなし（ステータス：204）
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        slotService.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }
}