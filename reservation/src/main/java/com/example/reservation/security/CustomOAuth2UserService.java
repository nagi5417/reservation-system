package com.example.reservation.security;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import com.example.reservation.repository.UserRepository;
import com.example.reservation.entity.User;
import com.example.reservation.entity.UserRole;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Googleからユーザー情報を取得
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // Googleから取得した情報を抽出
        String googleSub = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        // データベースからユーザーを検索（googleSubで検索）
        User user = userRepository.findByGoogleSub(googleSub)
            .orElseGet(() -> {
                // 見つからない場合、emailで再検索
                return userRepository.findByEmail(email)
                    .map(existingUser -> {
                        // メール+パスワードで登録済のユーザーに、Google情報を追加
                        existingUser.setGoogleSub(googleSub);
                        return userRepository.save(existingUser);
                    })
                    .orElseGet(() -> {
                        // 完全に新規ユーザー・新規登録
                        User newUser = User.builder()
                            .googleSub(googleSub)
                            .email(email)
                            .name(name)
                            .role(UserRole.USER)
                            .emailVerified(true)
                            .build();
                        return userRepository.save(newUser);
                    });
            });
        // アクセストークンとリフレッシュトークンを保存
        String accessToken = userRequest.getAccessToken().getTokenValue();
        log.info("Google アクセストークンを保存: userId={}, tokenLength={}", user.getId(), accessToken.length());
        user.setGoogleAccessToken(accessToken);
        // リフレッシュトークンは初回ログイン時のみ取得できる
        if (userRequest.getAccessToken().getScopes().contains("offline_access")) {
            // リフレッシュトークンが取得できる場合のみ保存
            // 注: Google OAuth2の設定でoffline_accessスコープが必要
        }
        User savedUser = userRepository.save(user);
        log.info("ユーザー保存完了: userId={}, hasAccessToken={}", savedUser.getId(), savedUser.getGoogleAccessToken() != null);

        return new CustomUserDetails(savedUser);
    }
}