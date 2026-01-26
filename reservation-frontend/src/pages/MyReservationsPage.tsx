import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { reservationApi } from "../api/reservationApi";
import type { Reservation } from "../types";
import { formatDateTime, isCancellable } from "../utils/dateUtils";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

export const MyReservationsPage: React.FC = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReservations = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await reservationApi.getMy();
            setReservations(data);
        } catch (error) {
            console.error("予約一覧の取得に失敗しました", error);
            setError("予約一覧の取得に失敗しました。もう一度お試しください。");
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleCancel = async (id: number) => {
        if (!window.confirm("この予約をキャンセルしますか？")) {
            return;
        }

        try {
            await reservationApi.cancel(id);
            alert("予約をキャンセルしました");
            fetchReservations();
        } catch (error) {
            console.error("予約のキャンセルに失敗しました", error);
            // バックエンドからのエラーメッセージを取得
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || "予約のキャンセルに失敗しました。もう一度お試しください。";
                alert(errorMessage);
            } else {
                alert("予期しないエラーが発生しました");
            }
        }
    };

    // 進行中の予約（RESERVED）のみ表示
    const activeReservations = reservations.filter(r => r.status === "RESERVED");

    return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            自分の予約一覧
          </h1>
  
          {loading && <LoadingSpinner />}
  
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
  
          {!loading && !error && activeReservations.length === 0 && (
            <Alert className="mb-4">
              <AlertDescription>予約はありません</AlertDescription>
            </Alert>
          )}
  
          {!loading && !error && activeReservations.length > 0 && (
            <div className="space-y-4 mb-6">
              {activeReservations.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg">{reservation.serviceMenuName}</CardTitle>
                    <CardDescription>
                      {formatDateTime(reservation.startTime)} 〜 {formatDateTime(reservation.endTime).split(' ')[1]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        ステータス:{' '}
                        <span className="text-green-600 font-semibold">予約中</span>
                      </p>
                      {reservation.notes && (
                        <p className="text-sm text-gray-600">
                          備考: {reservation.notes}
                        </p>
                      )}
                      {isCancellable(reservation.startTime) ? (
                        <Button
                          onClick={() => handleCancel(reservation.id)}
                          variant="destructive"
                          className="w-full mt-2"
                        >
                          キャンセル
                        </Button>
                      ) : (
                        <p className="text-sm text-red-600 mt-2">
                          キャンセル不可（24時間前を過ぎています）
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
  
          <div className="mt-6">
            <Link to="/reservations/history">
              <Button variant="outline" className="w-full">
                予約履歴を見る
              </Button>
            </Link>
          </div>
        </div>
    );
};
