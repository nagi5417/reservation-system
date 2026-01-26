package com.example.reservation.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.time.LocalDateTime;
import java.util.HashMap;

/**
 * アプリケーション全体の例外を一箇所で処理するグローバルハンドラー。
 * 
 * @RestControllerAdviceアノテーションにより、
 * すべての@RestControllerで発生した例外をこのクラスでキャッチする。
 * 
 * このクラスの役割：
 * ・カスタム例外を適切なHTTPステータスコードに変換
 * ・エラーレスポンスを統一フォーマットで返却
 * ・バリデーションエラーの詳細情報を提供
 * ・予期しない例外のキャッチと安全な処理
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * リソースが見つからない例外を処理する
     * 
     * 指定されたIDのリソース(ユーザー、予約、スロットなど)が
     * データベースに存在しない場合にスローされる。
     * 
     * @param ex ResourceNotFoundException インスタンス
     * @return エラー情報を含むResponseEntity(ステータス：４０４)
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(
        ResourceNotFoundException ex
    ) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.NOT_FOUND.value());
        errorResponse.put("error", "Not Found");
        errorResponse.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    /**
     * リソースの重複例外を処理する。
     *
     * 既に存在するリソースを再度作成しようとした場合にスローされる。
     *
     * @param ex DuplicateResourceException インスタンス
     * @return エラー情報を含むResponseEntity（ステータス：４０９）
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateResourceException(
        DuplicateResourceException ex
    ) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.CONFLICT.value());
        errorResponse.put("error", "Conflict");
        errorResponse.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    /**
     * 無効なリクエスト例外を処理する。
     *
     * ビジネスルール違反や無効な操作を試みた場合にスローされる。
     *
     * @param ex InvalidRequestException インスタンス
     * @return エラー情報を含むResponseEntity(ステータス：４００)
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidRequestException(
        InvalidRequestException ex
    ) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "Bad Request");
        errorResponse.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * 認証エラー例外を処理する。
     *
     * 認証に失敗した場合や権限がない操作を試みた場合にスローされる。
     *
     * @param ex Unauthorized インスタンス
     * @return エラー情報を含むResponseEntity（ステータス：４０１）
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorizedException(
        UnauthorizedException ex
    ) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.UNAUTHORIZED.value());
        errorResponse.put("error", "Unauthorized");
        errorResponse.put("message", ex.getMessage());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
    }

    /**
     * データ整合性違反例外を処理する。
     *
     * 外部キー制約違反などのデータベース制約に違反した場合にスローされる。
     * 例：他のデータから参照されているレコードを削除しようとした場合
     *
     * @param ex DataIntegrityViolationException インスタンス
     * @return エラー情報を含むResponseEntity（ステータス：409）
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolationException(
        DataIntegrityViolationException ex
    ) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.CONFLICT.value());
        errorResponse.put("error", "Conflict");

        // 外部キー制約違反の場合のメッセージ
        String message = "このデータは他のデータから参照されているため削除できません";
        if (ex.getMessage() != null && ex.getMessage().contains("slots")) {
            message = "このメニューは予約枠で使用されているため削除できません";
        }
        errorResponse.put("message", message);

        return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
    }

    /**
     * バリデーションエラー例外を処理する。
     *
     * アノテーションによるバリデーションが失敗した場合に自動的にスローされる。
     *
     * @param ex MethodArgumentNotValidException インスタンス
     * @return エラー情報とフィールドエラーを含むResponseEntity（ステータス：４００）
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
        MethodArgumentNotValidException ex
    ) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "Validation Failed");

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        });
        errorResponse.put("fieldErrors", fieldErrors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * すべての未処置例外をキャッチする汎用例外ハンドラー。
     *
     * 上記のどの例外ハンドラーにも該当しない例外をすべてキャッチする。
     * これにより、予期しないエラーが発生した場合予期しないエラーが発生した場合でもアプリケーションがクラッシュせず、
     * 適切なエラーレスポンスを返す。
     *
     * @param ex Exception インスタンス（すべての例外の基底クラス）
     * @return エラー情報を含むResponseEntity（ステータス：５００）
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorResponse.put("error", "Internal Server Error");
        errorResponse.put("message", "予期しないエラーが発生しました");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }

}