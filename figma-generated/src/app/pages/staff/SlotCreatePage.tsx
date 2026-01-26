import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { slotApi } from '../../../api/slotApi';
import { serviceMenuApi } from '../../../api/serviceMenuApi';
import type { ServiceMenu, SlotRequest } from '../../../types';
import { formatDateTimeInput } from '../../../utils/dateUtils';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ArrowLeft } from 'lucide-react';

export const SlotCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [capacity, setCapacity] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMenus = async () => {
      setLoading(true);
      try {
        const data = await serviceMenuApi.getAll();
        setMenus(data);
      } catch (error) {
        console.error('メニューの取得に失敗しました', error);
        setError('メニューの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();

    // デフォルトの開始時刻を設定
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    setStartDateTime(formatDateTimeInput(now));
  }, []);

  useEffect(() => {
    // メニューが選択されたら終了時刻を自動計算
    if (selectedMenuId && startDateTime) {
      const menu = menus.find((m) => m.id === parseInt(selectedMenuId));
      if (menu) {
        const start = new Date(startDateTime);
        const end = new Date(start.getTime() + menu.durationMinutes * 60 * 1000);
        setEndDateTime(formatDateTimeInput(end));
      }
    }
  }, [selectedMenuId, startDateTime, menus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data: SlotRequest = {
        serviceMenuId: parseInt(selectedMenuId),
        startTime: new Date(startDateTime).toISOString(),
        endTime: new Date(endDateTime).toISOString(),
        capacity,
      };

      await slotApi.create(data);
      navigate('/staff/slots');
    } catch (error: unknown) {
      console.error('予約枠作成に失敗しました', error);
      if (typeof error === 'object' && error !== null && 'message' in error) {
        setError((error as { message: string }).message);
      } else {
        setError('予約枠作成に失敗しました');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/staff/slots" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" />
        予約枠管理に戻る
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>予約枠作成</CardTitle>
          <CardDescription>新しい予約枠を作成します</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {menus.length === 0 && (
              <Alert>
                <AlertDescription>
                  メニューが作成されていません。
                  <Link to="/staff/menus" className="text-blue-600 hover:underline ml-2">
                    メニュー管理へ
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="menu">メニュー</Label>
              <Select value={selectedMenuId} onValueChange={setSelectedMenuId} required>
                <SelectTrigger id="menu">
                  <SelectValue placeholder="メニューを選択" />
                </SelectTrigger>
                <SelectContent>
                  {menus.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id.toString()}>
                      {menu.name} ({menu.durationMinutes}分)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDateTime">開始日時</Label>
              <Input
                id="startDateTime"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDateTime">終了日時</Label>
              <Input
                id="endDateTime"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                required
                disabled
              />
              <p className="text-sm text-muted-foreground">※ メニューの所要時間から自動計算</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">定員</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value))}
                required
                min="1"
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => navigate('/staff/slots')} className="flex-1">
                キャンセル
              </Button>
              <Button type="submit" disabled={submitting || menus.length === 0} className="flex-1">
                {submitting ? '作成中...' : '作成'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
