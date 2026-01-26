package com.example.reservation.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

/**
 * メール送信機能を提供するサービスクラス。
 *
 * JavaMailSenderを使用してメール送信を行う。
 * 開発環境ではMailHog、本番環境では実際のSMTPサーバーを使用する。
 *
 * 送信成功・失敗はログに記録される（SLF4J使用）
 */
@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Value("${app.mail.from:noreply@reservation-system.com}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * メール認証用の確認メールを送信する。
     * 
     * 新規ユーザー登録時に呼び出され、ユーザーのメールアドレスに
     * 確認用のリンクを含むHTML形式のメールを送信する。
     * 
     * @param email 送信先のメールアドレス
     * @param token メール認証トークン（UUID形式）
     * @throws RunTimeException メール送信に失敗した場合
     */
    public void sendVerificationEmail(String email, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("【予約システム】メールアドレスの確認");
            helper.setFrom(fromAddress);

            String verificationUrl = baseUrl + "/api/auth/verify?token=" + token;
            String htmlContent = buildVerificationEmailHtml(verificationUrl);

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("確認メール送信成功: {}", email);

        } catch (MessagingException e) {
            log.error("確認メール送信失敗: {}", email, e);
            throw new RuntimeException("メール送信に失敗しました", e);
        }
    }

    /**
     * メール認証用のHTML形式のメール本文を構築する。
     *
     * Text Blocksを使用してHTML形式のメール本文を生成する。
     *
     * @param verificationUrl 確認用URL（トークンを含む）
     * @return HTML形式のメール本文
     */
    private String buildVerificationEmailHtml(String verificationUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .button {
                            display: inline-block;
                            padding:12px 24px;
                            background-color: #007bff;
                            color: #ffffff !important;
                            text-decoration: none;
                            border-radius: 4px;
                            margin: 20px 0;
                        }
                        .footer {
                            margin-top: 30px;
                            font-size: 12px;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>予約システムへようこそ！</h2>
                        <p>ご登録ありがとうございます。</p>
                        <p>以下のボタンをクリックして、メールアドレスの確認を完了してください。</p>
                        <a href="%s" class="button">メールアドレスを確認する</a>
                        <p>または、以下のURLをブラウザにコピー&ペーストしてください：</p>
                        <p style="
                            word-break:break-all;
                            background-color: #f5f5f5;
                            padding: 10px;
                            border-radius: 4px;
                        "> %s </p>
                        <div class="footer">
                            <p>このリンクは24時間有効です。</p>
                            <p>このメールに心当たりがない場合は、削除していただいて構いません。</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(verificationUrl, verificationUrl);
    }

}