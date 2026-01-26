package com.example.reservation.exception;

/**
 * 無効なリクエストやビジネスルール違反を表すカスタム例外クラス。
 *
 クライアントからのリクエストが形式的に正しいが、
 ビジネスロジック上無効な操作を試みた場合にスローされる。
 */
public class InvalidRequestException extends RuntimeException {

    /**
     * 指定されたエラーメッセージを持つInvalidRequestExceptionを構築する。
     * @param message エラーメッセージ
     */
    public InvalidRequestException(String message) {
        super(message);
    }
}