package com.example.reservation.security;

import java.io.IOException;
import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;

    @org.springframework.beans.factory.annotation.Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    public SecurityConfig(
        CustomOAuth2UserService customOAuth2UserService
    ) {
        this.customOAuth2UserService = customOAuth2UserService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CORS設定
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // CSRF対策（今回は無効化、本番環境では有効化を検討）
            .csrf(csrf -> csrf.disable())

            // セッション管理（セッションベース認証を有効化）
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )

            // API向け認証エラーハンドリング（302リダイレクトではなく401を返す）
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(apiAuthenticationEntryPoint())
            )

            // URLごとのアクセス制御
            .authorizeHttpRequests(authorize -> authorize
                // 公開API（認証不要）
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api-docs/**").permitAll()
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/swagger-ui.html").permitAll()

                // 予約枠一覧・詳細（公開API）
                .requestMatchers("/api/slots/**").permitAll()

                // メニュー関連
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/menus/**").permitAll()
                .requestMatchers("/api/menus/**").hasRole("STAFF")

                // スタッフ専用API
                .requestMatchers("/api/staff/**").hasRole("STAFF")

                // 予約API（認証必須）
                .requestMatchers("/api/reservations/**").authenticated()

                // ユーザー情報取得（認証必須）
                .requestMatchers("/api/users/me").authenticated()

                // その他のAPIは認証が必要
                .requestMatchers("/api/**").authenticated()

                // それ以外は許可
                .anyRequest().permitAll()
            )

            // フォームログイン（メール＋パスワード）
            .formLogin(form -> form
                .loginPage("/login") // ログインページのURL
                .failureHandler(new AuthenticationFailureHandler() {
                    @Override
                    public void onAuthenticationFailure(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        org.springframework.security.core.AuthenticationException exception
                    ) throws IOException {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");

                        ObjectMapper objectMapper = new ObjectMapper();
                        String jsonResponse = objectMapper.writeValueAsString(
                            java.util.Map.of(
                                "timestamp", java.time.LocalDateTime.now().toString(),
                                "status", 401,
                                "error", "Unauthorized",
                                "message", "メールアドレスまたはパスワードが正しくありません"
                            )
                        );

                        response.getWriter().write(jsonResponse);
                        response.getWriter().flush();
                    }
                })
                .permitAll()
            )

            // OAuth2ログイン（Google）
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login") // ログインページのURL
                .defaultSuccessUrl(appBaseUrl + "/", true) // 認証成功後のリダイレクト先
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService) // CustomOAuth2UserServiceを使う
                )
            )

            // ログアウト（
            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler(new LogoutSuccessHandler() {
                    @Override
                    public void onLogoutSuccess(
                        HttpServletRequest request,
                        HttpServletResponse response,
                        org.springframework.security.core.Authentication authentication
                    ) throws IOException {
                        response.setStatus(HttpServletResponse.SC_OK);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");

                        ObjectMapper objectMapper = new ObjectMapper();
                        String jsonResponse = objectMapper.writeValueAsString(
                            java.util.Map.of("message", "ログアウトしました")
                        );

                        response.getWriter().write(jsonResponse);
                        response.getWriter().flush();
                    }
                })
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // ローカル開発環境とVercel本番環境の両方を許可
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "https://reservation-system-liart.vercel.app"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationEntryPoint apiAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            ObjectMapper objectMapper = new ObjectMapper();
            String jsonResponse = objectMapper.writeValueAsString(
                java.util.Map.of(
                    "timestamp", java.time.LocalDateTime.now().toString(),
                    "status", 401,
                    "error", "Unauthorized",
                    "message", "認証が必要です。ログインしてください。"
                )
            );

            response.getWriter().write(jsonResponse);
            response.getWriter().flush();
        };
    }
}
