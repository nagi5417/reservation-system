package com.example.reservation.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.reservation.dto.AuthResponse;
import com.example.reservation.dto.LoginRequest;
import com.example.reservation.dto.RegisterRequest;
import com.example.reservation.entity.EmailVerificationToken;
import com.example.reservation.entity.User;
import com.example.reservation.entity.UserRole;
import com.example.reservation.repository.EmailVerificationTokenRepository;
import com.example.reservation.repository.UserRepository;
import com.example.reservation.security.CustomUserDetails;

import jakarta.servlet.http.HttpServletRequest;

import com.example.reservation.exception.DuplicateResourceException;
import com.example.reservation.exception.InvalidRequestException;
import com.example.reservation.exception.UnauthorizedException;

/**
 * 認証・登録を管理するサービスクラス。
 *
 * このクラスは以下の機能を提供します：
 * ・新規ユーザー登録（メールアドレス・パスワード認証）
 * ・メール認証トークンの生成と送信
 * ・メール認証の確認
 * ・ログイン処理
 *
 * 登録時にメール認証トークンを生成し、ユーザーのメールアドレスに
 * 確認メールを送信する。
 * ユーザーがメール内のリンクをクリックすることでメールアドレスが確認され、
 * アカウントが有効化される・。
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final SecurityContextRepository securityContextRepository =
        new HttpSessionSecurityContextRepository();

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        EmailService emailService,
        EmailVerificationTokenRepository emailVerificationTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;

    }

    /**
     * 新規ユーザーを登録して、メール認証トークンを生成して確認メールを送信する
     *
     * @param request 登録リクエスト（メールアドレス、パスワード、名前）
     * @return 登録されたユーザーの情報を含むレスポンス
     * @throws DuplicateResourceException メールアドレスが既に登録されている場合
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // メールアドレスの重複チェック
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new DuplicateResourceException(
                "このメールアドレスはすでに使用されています: " + request.getEmail()
            );
        }

        // 新規ユーザー作成
        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .name(request.getName())
            .role(UserRole.USER)
            .emailVerified(false)
            .build();

        User savedUser = userRepository.save(user);

        // メール認証トークン生成
        String token = UUID.randomUUID().toString();

        // トークンエンティティ生成
        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
            .user(savedUser)
            .token(token)
            .expiresAt(LocalDateTime.now().plusHours(24))
            .build();

        // トークン保存
        emailVerificationTokenRepository.save(verificationToken);

        // 確認メール送信
        emailService.sendVerificationEmail(savedUser.getEmail(), token);

        // レスポンスDTO作成
        return AuthResponse.builder()
            .userId(savedUser.getId())
            .email(savedUser.getEmail())
            .name(savedUser.getName())
            .role(savedUser.getRole().name())
            .message("登録に成功しました")
            .build();
    }

    /**
     * メール認証トークンを検証し、ユーザーのメールアドレスを確認済にする
     *
     * @param token メール認証トークン（UUID形式）
     * @throws InvalidRequestException トークンが無効または有効期限が切れている場合
     */
    @Transactional
    public void verifyEmail(String token) {
        // トークン検索
        EmailVerificationToken tokenEntity = emailVerificationTokenRepository.findByToken(token)
            .orElseThrow(() -> new InvalidRequestException("無効なトークンです"));

        // 有効期限チェック
        if (LocalDateTime.now().isAfter(tokenEntity.getExpiresAt())) {
            throw new InvalidRequestException("トークンの有効期限が切れています");
        }

        // ユーザーのemailVerifiedフラグを更新
        User user = tokenEntity.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        // トークンを削除
        emailVerificationTokenRepository.delete(tokenEntity);
    }

    /**
     * メールアドレスとパスワードを使用してログイン処理を行う
     *
     * @param request ログインリクエスト（メールアドレス、パスワード）
     * @return ログインしたユーザーの情報を含む認証レスポンス
     * @throws UnauthorizedException メールアドレスまたはパスワードが正しくない場合
     * @throws InvalidRequestException メール認証が完了していない場合
     */
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        // ユーザー検索
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new UnauthorizedException("メールアドレスまたはパスワードが正しくありません"));

        // パスワード照合
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("メールアドレスまたはパスワードが正しくありません");
        }

        // メール認証済みかチェック
        if (!user.isEmailVerified()) {
            throw new InvalidRequestException("メール認証が完了していません。登録時に送信されたメールのリンクをクリックしてください。");
        }

        // Spring SecurityのSecurityContextに認証情報を設定
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
            );
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // SecurityContextをセッションに保存
        securityContextRepository.saveContext(
            SecurityContextHolder.getContext(),
            httpRequest,
            null
        );

        // レスポンスDTO作成
        return AuthResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole().name())
            .message("ログインに成功しました")
            .build();
    }
}