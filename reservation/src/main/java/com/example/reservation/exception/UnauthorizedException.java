package com.example.reservation.exception;

/**
 * 認証エラーまたは権限エラーを表すカスタム例外クラス。
 * 
 * この例外は以下の2つの状況でスローされる：
 * ・認証（Authentication）の失敗 - ユーザーの身元確認ができない
 * ・認可（Authorization）の失敗 - ユーザーに操作権限がない
 */
public class UnauthorizedException extends RuntimeException {

    /**
     * 指定されたエラーメッセージを持つUnauthorizedExceptionを構築する。
     *
     * @param message エラーメッセージ（ユーザーに表示される）
     */
    public UnauthorizedException(String message) {
        super(message);
    }
}