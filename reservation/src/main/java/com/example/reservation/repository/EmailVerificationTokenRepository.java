package com.example.reservation.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.reservation.entity.EmailVerificationToken;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    
    // トークン文字列で検索
    Optional<EmailVerificationToken> findByToken(String token);

    // ユーザーIDで検索
    Optional<EmailVerificationToken> findByUserId(Long userId);

    // 有効期限切れのトークンを削除（バッチ処理用）
    List<EmailVerificationToken> findByExpiresAtBefore(LocalDateTime dateTime);
}
