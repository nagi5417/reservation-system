import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { slotApi } from '../../../api/slotApi';
import { serviceMenuApi } from '../../../api/serviceMenuApi';
import type { Slot, ServiceMenu } from '../../../types';
import { formatDateTime } from '../../../utils/dateUtils';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export const SlotManagementPage: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSlots = async () => {
    setLoading(true);
    setError('');

    try {
      const [slotsData, menusData] = await Promise.all([
        slotApi.getAll(),
        serviceMenuApi.getAll(),
      ]);
      setSlots(slotsData);
      setMenus(menusData);
    } catch (error) {
      console.error('データの取得に失敗しました', error);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await slotApi.delete(id);
      toast.success('予約枠を削除しました');
      fetchSlots();
    } catch (error: unknown) {
      console.error('予約枠削除に失敗しました', error);
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('予約枠削除に失敗しました');
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1>予約枠管理</h1>
        <Link to="/staff/slots/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規予約枠作成
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && menus.length === 0 && (
        <Alert className="mb-6">
          <AlertDescription>
            メニューが作成されていません。
            <Link to="/staff/menus" className="text-blue-600 hover:underline ml-2">
              メニュー管理へ
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {!error && slots.length === 0 && menus.length > 0 && (
        <Alert className="mb-6">
          <AlertDescription>予約枠がありません。新規作成してください。</AlertDescription>
        </Alert>
      )}

      {!error && slots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => (
            <Card key={slot.id}>
              <CardHeader>
                <CardTitle>{slot.serviceMenuName}</CardTitle>
                <CardDescription>
                  {formatDateTime(slot.startTime)} 〜 {formatDateTime(slot.endTime).split(' ')[1]}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">定員</p>
                    <p>{slot.capacity}人</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ステータス</p>
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

                <div className="flex gap-2">
                  <Link to={`/staff/slots/${slot.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      編集
                    </Button>
                  </Link>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        削除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>予約枠を削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          この操作は取り消せません。本当に削除してもよろしいですか？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(slot.id)}>
                          削除する
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
