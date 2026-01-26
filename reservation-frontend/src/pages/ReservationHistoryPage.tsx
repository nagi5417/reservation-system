import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reservationApi } from "../api/reservationApi";
import type { Reservation } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

export const ReservationHistoryPage: React.FC = () => {
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
            console.error("予約履歴の取得に失敗しました", error);
            setError("予約履歴の取得に失敗しました。もう一度お試しください。");
            setReservations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    // ステータスに応じた表示テキストと色を返す
    const getStatusDisplay = (status: string) => {
        switch (status) {
            case "RESERVED":
                return { text: "予約済み", color: "text-green-600" };
            case "CANCELLED":
                return { text: "キャンセル済み", color: "text-red-600" };
            default:
                return { text: status, color: "text-gray-600"};
        }
    };

    // 予約を新しい順に並び替え
    const sortedReservations = [...reservations].sort((a, b) => {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    return (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              予約履歴
            </h1>
            <Link to="/reservations/my">
              <Button variant="outline">予約一覧に戻る</Button>
            </Link>
          </div>

          {loading && <LoadingSpinner />}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && sortedReservations.length === 0 && (
            <Alert className="mb-4">
              <AlertDescription>予約履歴はありません</AlertDescription>
            </Alert>
          )}

          {!loading && !error && sortedReservations.length > 0 && (
            <div className="space-y-4">
              {sortedReservations.map((reservation) => {
                const statusDisplay = getStatusDisplay(reservation.status);
                return (
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
                          <span className={`${statusDisplay.color} font-semibold`}>
                            {statusDisplay.text}
                          </span>
                        </p>
                        {reservation.notes && (
                          <p className="text-sm text-gray-600">
                            備考: {reservation.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      );
};