package com.example.reservation.security;

import com.example.reservation.repository.UserRepository;
import com.example.reservation.entity.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Spring SecurityのUserDetailsServiceインターフェースを実装したサービスクラス。
 * 
 * ユーザー名（メールアドレス）からUserエンティティを取得し、
 * CustomUserDetailsに変換してSpring Securityに返す。
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException(
                "ユーザーが見つかりません: " + email
            ));

        return new CustomUserDetails(user);
    }

}
