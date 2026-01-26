package com.example.reservation.service;

import org.springframework.stereotype.Service;

import com.example.reservation.entity.User;
import com.example.reservation.exception.ResourceNotFoundException;
import com.example.reservation.dto.UserResponse;
import com.example.reservation.repository.UserRepository;

/**
 * ユーザー管理を行うサービスクラス。
 * ・ユーザー情報の取得
 * ・Entity・DTO変換
 */
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * 指定されたIDのユーザー情報を取得する。
     * @param id ユーザーID
     * @return ユーザーの詳細情報
     * @throws ResourceNotFoundException ユーザーが見つからない場合
     */
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("ユーザーが見つかりません: ID=" + id));

        return convertToResponse(user);
    }

    /**
     * UserエンティティをUserResponse DTOに変換する。
     * エンティティからクライアントに返すためのDTOを構築する。機密情報は含まれない。
     * 
     * @param user Userエンティティ
     * @return UserResponse DTO
     */
    private UserResponse convertToResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .role(user.getRole().name())
            .emailVerified(user.isEmailVerified())
            .build();
    }
}