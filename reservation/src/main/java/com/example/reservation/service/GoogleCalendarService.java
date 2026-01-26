package com.example.reservation.service;

import java.io.IOException;
import java.time.ZoneId;
import java.util.Date;

import org.springframework.stereotype.Service;

import com.example.reservation.entity.Reservation;
import com.example.reservation.entity.User;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.Calendar;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GoogleCalendarService {

    /**
     * Googleカレンダーにイベントを作成する。
     *
     * Googleログインユーザーの予約情報をもとに、Googleカレンダーにイベントを自動生成する。
     * メール/パスワードログインユーザーの場合は、カレンダー連携をスキップする。
     *
     * エラー時の扱い：カレンダー連携に失敗しても予約処理自体は成功扱いとしてnullを返してログ出力のみを行う。
     * 
     * @param user ユーザー情報（Googleアクセストークンを含む）
     * @param reservation 予約情報（予約枠、メニュー情報を含む）
     * @return 作成されたカレンダーイベントID。作成失敗時またはスキップ時はnull
     */
    public String createEvent(User user, Reservation reservation) {
        // Googleログインユーザーでない場合はスキップ
        if (user.getGoogleAccessToken() == null) {
            log.info("Googleログインユーザーではないため、カレンダー連携をスキップ: userId={}",
            user.getId());

            return null;
        }

        try {
            Calendar calendarService = buildCalendarService(user.getGoogleAccessToken());

            Event event = new Event()
                    .setSummary("予約：" + reservation.getSlot().getServiceMenu().getName())
                    .setDescription("予約ID: " + reservation.getId() + "\n予約システムより");

            // 開始時刻
            EventDateTime start = new EventDateTime()
                    .setDateTime(new DateTime(
                            Date.from(reservation.getSlot().getStartTime()
                                    .atZone(ZoneId.systemDefault()).toInstant())
                    ));
            event.setStart(start);

            // 終了時刻
            EventDateTime end = new EventDateTime()
                    .setDateTime(new DateTime(
                            Date.from(reservation.getSlot().getEndTime()
                                    .atZone(ZoneId.systemDefault()).toInstant())
                    ));
            event.setEnd(end);

            // イベント作成
            Event createdEvent = calendarService.events()
                    .insert("primary", event)
                    .execute();

            log.info("Googleカレンダーイベント作成成功: eventId={}, reservationId={}",
                    createdEvent.getId(), reservation.getId());

            return createdEvent.getId();
        } catch (Exception e) {
            log.error("Googleカレンダーイベント作成失敗: eventId={}, reservationId={}",
                user.getId(), reservation.getId(), e);
            return null;
        }
    }

    /**
     * Googleカレンダーのイベントを削除する。
     *
     * 予約キャンセル時にGoogleカレンダーに作成されたイベントを削除する。
     * eventIdが存在しない場合、またはGoogleログインユーザーでない場合は、削除をスキップする。
     *
     * エラー時の扱い：カレンダー削除に失敗しても予約キャンセル処理自体は成功扱いとしてログ出力のみ行う。
     *
     * @param user ユーザー情報（Googleのアクセストークンを含む）
     * @param eventId 削除対象のカレンダーイベントID
     */
    public void deleteEvent(User user, String eventId) {
        // eventIdがない場合はスキップ
        if (eventId == null || eventId.isEmpty()) {
            log.info("eventIdが存在しないため、カレンダー削除をスキップ: userId={}", user.getId());
            return;
        }

        // Googleログインユーザーではない場合、スキップ
        if(user.getGoogleAccessToken() == null) {
            log.info("Googleログインユーザーでないため、カレンダー削除をスキップ: userId={}", user.getId());
            return;
        }

        try {
            Calendar calendarService = buildCalendarService(user.getGoogleAccessToken());

            calendarService.events()
                    .delete("primary", eventId)
                    .execute();

            log.info("Googleカレンダーイベント削除成功: eventId={}, userId={}", eventId, user.getId());
        } catch (Exception e) {
            log.error("Googleカレンダーイベント削除失敗: eventId={}, userId={}", eventId, user.getId(), e);
        }
    }

    /**
     * Google Calendar APIのクライアントを構築する。
     *
     * ユーザーのアクセストークンを使用して、Google Calendar APIと通信するための
     * Calendarサービスインスタンスを作成する。
     *
     * すべてのAPIリクエストに対して、Authorizationヘッダーが自動的に設定される。
     *
     * @param accessToken Googleアクセストークン
     * @return Google Calendar APIクライアント
     * @throws IOException API通信エラーが発生した場合
     */
    private Calendar buildCalendarService(String accessToken) throws IOException {
        HttpRequestInitializer requestInitializer = request -> {
            request.getHeaders().setAuthorization("Bearer " + accessToken);
        };

        return new Calendar.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                requestInitializer
        )
                .setApplicationName("Reservation System")
                .build();
    }
}