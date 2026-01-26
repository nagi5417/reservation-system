import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { slotApi } from '../../api/slotApi';
import { reservationApi } from '../../api/reservationApi';
import { useAuth } from '../../contexts/AuthContext';
import type { Slot } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { ArrowLeft } from 'lucide-react';

export const SlotDetailPage: React.FC = () => {
  const { slotId } = useParams<{ slotId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSlot = async () => {
      if (!slotId) return;

      setLoading(true);
      setError('');

      try {
        const data = await slotApi.getById(parseInt(slotId));
        setSlot(data);
      } catch (error) {
        console.error('予約枠の取得に失敗しました', error);
        setError('予約枠の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSlot();
  }, [slotId]);

  const handleReserve = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!slot) return;

    setSubmitting(true);
    setError('');

    try {
      await reservationApi.create({
        slotId: slot.id,
        notes: notes || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/reservations/my'), 2000);
    } catch (error: unknown) {
      console.error('予約作成に失敗しました', error);
      if (typeof error === 'object' && error !== null && 'message' in error) {
        setError((error as { message: string }).message);
      } else {
        setError('予約作成に失敗しました');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!slot) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>予約枠が見つかりませんでした</AlertDescription>
        </Alert>
      </div>
    );
  }

  const availableSeats = slot.capacity;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" />
        戻る
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>予約枠詳細</CardTitle>
          <CardDescription>{slot.serviceMenuName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <Alert>
              <AlertDescription>
                予約が完了しました！自分の予約ページに移動します...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">日時</p>
                <p>{formatDateTime(slot.startTime)} 〜</p>
                <p>{formatDateTime(slot.endTime).split(' ')[1]}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">定員</p>
                <p>{slot.capacity}人</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">残席</p>
                <p className="text-lg">
                  {availableSeats}人
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">ステータス</p>
                <p
                  className={
                    slot.status === 'AVAILABLE'
                      ? 'text-green-600'
                      : slot.status === 'FULL'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }
                >
                  {slot.status === 'AVAILABLE' ? '予約可能' : slot.status === 'FULL' ? '満員' : '一部予約済'}
                </p>
              </div>
            </div>
          </div>

          {!success && slot.status !== 'FULL' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="notes">備考（任意）</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="何かご要望があればご記入ください"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleReserve}
                className="w-full"
                disabled={submitting}
              >
                {submitting ? '予約中...' : 'この枠を予約する'}
              </Button>

              {!user && (
                <p className="text-sm text-center text-muted-foreground">
                  ※ 予約にはログインが必要です
                </p>
              )}
            </>
          )}

          {slot.status === 'FULL' && (
            <Alert>
              <AlertDescription>この予約枠は満員です</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
