package com.example.reservation.controller;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.reservation.dto.AuthResponse;
import com.example.reservation.dto.LoginRequest;
import com.example.reservation.dto.RegisterRequest;
import com.example.reservation.entity.User;
import com.example.reservation.security.CustomUserDetails;
import com.example.reservation.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * 認証関連のREST APIエンドポイントを提供するControllerクラス。
 *
 * このControllerは以下の認証機能を提供する：
 * ・新規ユーザー登録（メールアドレス・パスワード認証）
 * ・ログイン処理
 * ・メールアドレスの認証情報
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 新規ユーザーを登録し、確認メールを送信する。
     *
     * メールアドレスとパスワードを使用した新規ユーザーの登録を処理する。
     * 登録後、メール認証用のトークンが生成され、ユーザーのメールアドレスに確認メールが送信される。
     *
     * @param request 登録リクエスト（メールアドレス、パスワード、名前）
     * @return 登録されたユーザーの情報を含むレスポンス（ステータス：２０１）
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * メールアドレスとパスワードを使用してログインする。
     *
     * ユーザー認証を行い、認証成功時にユーザー情報を返す。
     *
     * @param request ログインリクエスト（メールアドレス・パスワード）
     * @return ログインしたユーザーの情報を含むレスポンス（ステータス：２００）
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
        @Valid @RequestBody LoginRequest request,
        HttpServletRequest httpRequest
    ) {
        AuthResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(response);
    }

    /**
       * 現在ログインしているユーザーの情報を取得します。
       *
       * @return 現在のユーザー情報を含むレスポンス（ステータス：200）
       */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userDetails.getUser();

        AuthResponse response = AuthResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole().name())
            .message("ユーザー情報取得")
            .build();

        return ResponseEntity.ok(response);
    }

    /**
     * メール認証トークンを検証し、ユーザーのメールアドレスを確認済にする。
     *
     * ユーザーが確認メール内のリンクをクリックしたときに呼び出される。
     * トークンを検証し、有効な場合はユーザーのemailVerifiedフラグをtrueに更新する。
     * 認証完了後、フロントエンドのログインページにリダイレクトする。
     *
     * @param token メール認証トークン（UUID形式）
     * @return ログインページへのリダイレクト（ステータス：302）
     */
    @GetMapping("/verify")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        try {
            authService.verifyEmail(token);
            // 認証成功：ログインページにリダイレクト（成功メッセージ付き）
            return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(baseUrl + "/login?verified=true"))
                .build();
        } catch (Exception e) {
            // 認証失敗：ログインページにリダイレクト（エラーメッセージ付き）
            return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(baseUrl + "/login?error=verification_failed"))
                .build();
        }
    }

}