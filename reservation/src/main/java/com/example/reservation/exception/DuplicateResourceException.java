package com.example.reservation.exception;

/**
 * リソースの重複を表すカスタム例外クラス。
 * 既に存在するリソース（ユーザー、メニューなど）を再度作成しようとした場合にスローされる。
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }
}