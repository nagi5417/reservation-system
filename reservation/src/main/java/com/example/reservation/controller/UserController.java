package com.example.reservation.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.reservation.dto.UserResponse;
import com.example.reservation.service.UserService;

/**
 * ユーザー情報管理のREST APIエンドポイントを提供するコントローラークラス。
 *
 * このコントローラーは以下の機能を提供します：
 * ・ユーザー情報の取得<
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 指定されたIDのユーザー情報を取得します。
     *
     * ユーザーのプロフィール表示やマイページで使用されます。
     * パスワード（ハッシュ化済み）は含まれず、安全な情報のみが返されます。
     *
     * @param id ユーザーID
     * @return ユーザーの詳細情報を含むレスポンス（ステータス：200）
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }
}