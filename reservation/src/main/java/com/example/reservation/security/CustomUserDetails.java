package com.example.reservation.security;

import com.example.reservation.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

public class CustomUserDetails implements UserDetails, OAuth2User {

    private final User user;

    public CustomUserDetails(User user) {
        this.user = user;
    }

    // ユーザーの権限を返す
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
    }

    // パスワードを返す（今回はnull、OAuth2を使うため）
    @Override
    public String getPassword() {
        return user.getPassword(); // Userエンティティからパスワードを取得
    }

    // ユーザー名を返す（今回はEmailを返す）
    @Override
    public String getUsername() {
        return user.getEmail();
    }

    // アカウントが期限切れではないか
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // アカウントがロックされていないか
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // 認証情報が期限切れでないか
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // アカウントが有効化（メール認証済か）
    @Override
    public boolean isEnabled() {
        return user.isEmailVerified();
    }

    // もとのエンティティを取得するメソッド（カスタム）
    public User getUser() {
        return user;
    }

    // ===== OAuth2User のメソッド実装 =====

    @Override
    public Map<String, Object> getAttributes() {
        // OAuth2の属性情報（今回は使用しないので空のMapを返す）
        return Collections.emptyMap();
    }

    @Override
    public String getName() {
        return user.getName();
    }
}
