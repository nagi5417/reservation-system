import React, { useState, useEffect} from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { slotApi } from "../api/slotApi";
import { reservationApi } from "../api/reservationApi";
import type { Slot } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

export const SlotDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [slot, setSlot] = useState<Slot | null>(null);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const fetchSlot = async () => {
        if (!id) {
            setError("予約枠IDが指定されていません");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await slotApi.getById(Number(id));
            setSlot(data);
        } catch (error) {
            console.error("予約枠の取得に失敗しました", error);
            setError("予約枠の取得に失敗しました。もう一度お試しください");
            setSlot(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlot();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!slot) return;

        setSubmitting(true);

        try {
            await reservationApi.create({
                slotId: slot.id,
                notes: notes || undefined,
            });
            alert("予約が完了しました！");
            navigate("/reservations/my");
        } catch (error: unknown) {
            console.error("予約の作成に失敗しました", error);
            // バックエンドからのエラーメッセージを取得
            let errorMessage = "予約の作成に失敗しました。もう一度お試しください";
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } };
                if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                }
            }
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const getAvailableSeats = (slot: Slot): number => {
        return slot.availableSeats;
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Link to="/">
            <Button variant="outline">予約枠一覧に戻る</Button>
          </Link>
        </div>
      );
    }

    if (!slot) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert className="mb-4">
            <AlertDescription>予約枠が見つかりませんでした</AlertDescription>
          </Alert>
          <Link to="/">
            <Button variant="outline">予約枠一覧に戻る</Button>
          </Link>
        </div>
      );
    }

    const isFull = slot.status === "FULL";

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          予約枠詳細
        </h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{slot.serviceMenuName}</CardTitle>
            <CardDescription>
              {formatDateTime(slot.startTime)} 〜 {formatDateTime(slot.endTime).split(' ')[1]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">残席:</span>
                <span className="text-lg font-bold">{getAvailableSeats(slot)} / {slot.capacity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">ステータス:</span>
                <span
                  className={`font-semibold ${
                    slot.status === 'AVAILABLE'
                      ? 'text-green-600'
                      : slot.status === 'FULL'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {slot.status === 'AVAILABLE' ? '予約可能' : slot.status === 'FULL' ? '満員' : '一部予約済'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isFull ? (
          <Card>
            <CardHeader>
              <CardTitle>予約する</CardTitle>
              <CardDescription>備考がある場合は入力してください</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">備考（任意）</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="特別なリクエストや要望があればご記入ください"
                    rows={4}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "予約中..." : "予約を確定する"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>この予約枠は満員です</AlertDescription>
          </Alert>
        )}

        <div className="mt-6">
          <Link to="/">
            <Button variant="outline" className="w-full">
              予約枠一覧に戻る
            </Button>
          </Link>
        </div>
      </div>
    );
};