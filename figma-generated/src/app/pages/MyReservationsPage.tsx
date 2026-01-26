import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reservationApi } from '../../api/reservationApi';
import type { Reservation } from '../../types';
import { formatDateTime, isCancellable } from '../../utils/dateUtils';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { toast } from 'sonner';

export const MyReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReservations = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await reservationApi.getMy();
      setReservations(data.filter((r) => r.status === 'CONFIRMED'));
    } catch (error) {
      console.error('予約の取得に失敗しました', error);
      setError('予約の取得に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id: number) => {
    try {
      await reservationApi.cancel(id);
      toast.success('予約をキャンセルしました');
      fetchReservations();
    } catch (error: unknown) {
      console.error('キャンセルに失敗しました', error);
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('キャンセルに失敗しました');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1>自分の予約一覧（進行中）</h1>
        <Link to="/reservations/history">
          <Button variant="outline">予約履歴を見る</Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && reservations.length === 0 && (
        <Alert className="mb-6">
          <AlertDescription>予約はありません</AlertDescription>
        </Alert>
      )}

      {!error && reservations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.map((reservation) => {
            const canCancel = isCancellable(reservation.startTime);

            return (
              <Card key={reservation.id}>
                <CardHeader>
                  <CardTitle>{reservation.serviceMenuName}</CardTitle>
                  <CardDescription>
                    {formatDateTime(reservation.startTime)} 〜 {formatDateTime(reservation.endTime).split(' ')[1]}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    予約ID: <span>{reservation.id}</span>
                  </p>
                  <p className="text-sm">
                    ステータス:{' '}
                    <span className="text-green-600">予約中</span>
                  </p>
                  {reservation.notes && (
                    <p className="text-sm">
                      備考: <span className="text-muted-foreground">{reservation.notes}</span>
                    </p>
                  )}

                  {canCancel ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full mt-2">
                          キャンセル
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>予約をキャンセルしますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            この操作は取り消せません。予約をキャンセルしてもよろしいですか？
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>戻る</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleCancel(reservation.id)}>
                            キャンセルする
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <div className="mt-2">
                      <Alert variant="destructive">
                        <AlertDescription className="text-xs">
                          キャンセル不可（24時間前を過ぎています）
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
