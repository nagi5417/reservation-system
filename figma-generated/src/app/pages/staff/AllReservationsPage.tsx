import React, { useState, useEffect } from 'react';
import { reservationApi } from '../../../api/reservationApi';
import type { Reservation } from '../../../types';
import { formatDateTime } from '../../../utils/dateUtils';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export const AllReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await reservationApi.getAll();
        setReservations(data);
        setFilteredReservations(data);
      } catch (error) {
        console.error('予約の取得に失敗しました', error);
        setError('予約の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = reservations.filter(
        (r) =>
          r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.serviceMenuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.id.toString().includes(searchTerm)
      );
      setFilteredReservations(filtered);
    } else {
      setFilteredReservations(reservations);
    }
  }, [searchTerm, reservations]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const confirmedCount = filteredReservations.filter((r) => r.status === 'CONFIRMED').length;
  const cancelledCount = filteredReservations.filter((r) => r.status === 'CANCELLED').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6">全予約一覧</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>合計予約数</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl">{filteredReservations.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>予約中</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-green-600">{confirmedCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>キャンセル</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl text-red-600">{cancelledCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>検索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">ユーザー名、メニュー名、予約IDで検索</Label>
            <Input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="検索..."
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && filteredReservations.length === 0 && (
        <Alert className="mb-6">
          <AlertDescription>
            {searchTerm ? '検索条件に一致する予約がありません' : '予約がありません'}
          </AlertDescription>
        </Alert>
      )}

      {!error && filteredReservations.length > 0 && (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{reservation.serviceMenuName}</CardTitle>
                    <CardDescription>
                      予約ID: {reservation.id} | ユーザー: {reservation.userName}
                    </CardDescription>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      reservation.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {reservation.status === 'CONFIRMED' ? '予約中' : 'キャンセル済'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">開始日時</p>
                    <p>{formatDateTime(reservation.startTime)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">終了日時</p>
                    <p>{formatDateTime(reservation.endTime)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ユーザーID</p>
                    <p>{reservation.userId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">予約枠ID</p>
                    <p>{reservation.slotId}</p>
                  </div>
                  {reservation.notes && (
                    <div className="col-span-2 md:col-span-4">
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
