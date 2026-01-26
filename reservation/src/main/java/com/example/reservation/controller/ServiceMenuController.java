package com.example.reservation.controller;

import java.util.List;

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

import com.example.reservation.dto.ServiceMenuRequest;
import com.example.reservation.dto.ServiceMenuResponse;
import com.example.reservation.service.ServiceMenuService;

import jakarta.validation.Valid;

/**
 * サービスメニュー管理のREST APIエンドポイントを提供するコントローラークラス。
 *
 * このコントローラーは以下の機能を提供する：
 * ・すべてのサービスメニューの取得
 * ・特定のサービスメニューの取得
 * ・サービスメニューの新規作成
 * ・サービスメニューの更新
 * ・サービスメニューの削除
 */
@RestController
@RequestMapping("/api/service-menus")
public class ServiceMenuController {

    private final ServiceMenuService serviceMenuService;

    public ServiceMenuController(ServiceMenuService serviceMenuService) {
        this.serviceMenuService = serviceMenuService;
    }

    /**
     * 新しいサービスメニューを作成する。
     *
     * 管理者がサービスメニューを新規作成する際に使用される。
     *
     * @param request サービスメニュー作成リクエスト
     * @return 作成されたサービスメニューの情報を含むレスポンス（ステータス：201）
     */
    @PostMapping
    public ResponseEntity<ServiceMenuResponse> createServiceMenu(
        @Valid @RequestBody ServiceMenuRequest request
    ) {
        ServiceMenuResponse response = serviceMenuService.createServiceMenu(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * すべてのサービスメニューを取得する。
     *
     * ユーザーが予約可能なサービスメニューの一覧を表示する際に使用される。
     *
     * @return すべてのサービスメニューのリスト（ステータス：200）
     */
    @GetMapping
    public ResponseEntity<List<ServiceMenuResponse>> getAllServiceMenus() {
        List<ServiceMenuResponse> responses = serviceMenuService.getAllServiceMenus();
        return ResponseEntity.ok(responses);
    }

    /**
     * 指定されたIDのサービスメニューを取得する。
     *
     * 特定のサービスメニューの詳細を表示する際に使用される。
     *
     * @param id サービスメニューID
     * @return サービスメニューの詳細情報を含むレスポンス（ステータス：200）
     */
    @GetMapping("/{id}")
    public ResponseEntity<ServiceMenuResponse> getServiceMenuById(@PathVariable Long id) {
        ServiceMenuResponse response = serviceMenuService.getServiceMenuById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * 指定されたIDのサービスメニューを更新します。
     *
     * このエンドポイントは、管理者がサービスメニューの情報を更新する際に使用されます。
     *
     * @param id サービスメニューID
     * @param request サービスメニュー更新リクエスト
     * @return 更新されたサービスメニューの情報を含むレスポンス（ステータス：200）
     */
    @PutMapping("/{id}")
    public ResponseEntity<ServiceMenuResponse> updateServiceMenu(
        @PathVariable Long id,
        @Valid @RequestBody ServiceMenuRequest request
    ) {
        ServiceMenuResponse response = serviceMenuService.updateServiceMenu(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 指定されたIDのサービスメニューを削除する。
     *
     * 管理者がサービスメニューを削除する際に使用される。
     * 削除成功時はレスポンスボディを返さず、204 No Contentを返す。
     *
     * @param id サービスメニューID
     * @return レスポンスボディなし（ステータス：204）
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteServiceMenu(@PathVariable Long id) {
        serviceMenuService.deleteServiceMenu(id);
        return ResponseEntity.noContent().build();
    }
}