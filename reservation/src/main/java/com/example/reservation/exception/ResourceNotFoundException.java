package com.example.reservation.exception;

/**
 * リソースが見つからない場合にスローされるカスタムクラス。
 * 
 * 指定されたIDのリソース（ユーザー、予約、スロット、サービスメニューなど）が
 * データベースに存在しない場合にすろーされる。
 */
public class ResourceNotFoundException extends RuntimeException {
    
    /**
     * 指定されたエラーメッセージを持つResourceNotFoundExceptionを構築する。
     *
     * @param message エラーメッセージ（ユーザーに表示される）
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
