import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservationApi } from '../../api/reservationApi';
import type { Reservation } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft } from 'lucide-react';

export const ReservationHistoryPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await reservationApi.getMy();
        setReservations(data);
      } catch (error) {
        console.error('予約履歴の取得に失敗しました', error);
        setError('予約履歴の取得に失敗しました。もう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/reservations/my" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" />
        自分の予約に戻る
      </Link>

      <h1 className="mb-6">予約履歴</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && reservations.length === 0 && (
        <Alert className="mb-6">
          <AlertDescription>予約履歴はありません</AlertDescription>
        </Alert>
      )}

      {!error && reservations.length > 0 && (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{reservation.serviceMenuName}</CardTitle>
                    <CardDescription>
                      {formatDateTime(reservation.startTime)} 〜 {formatDateTime(reservation.endTime).split(' ')[1]}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      reservation.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {reservation.status === 'CONFIRMED' ? '予約済' : 'キャンセル済'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">予約ID</p>
                    <p>{reservation.id}</p>
                  </div>
                  {reservation.notes && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">備考</p>
                      <p>{reservation.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
