package com.example.reservation.repository;

import com.example.reservation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // メールアドレスでユーザーを検索
    Optional<User> findByEmail(String email);

    // Google Subでユーザーを検索
    Optional<User> findByGoogleSub(String googleSub);

    // メールアドレスの存在確認
    boolean existsByEmail(String email);
}
