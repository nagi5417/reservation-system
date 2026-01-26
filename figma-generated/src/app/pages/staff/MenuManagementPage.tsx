import React, { useState, useEffect } from 'react';
import { serviceMenuApi } from '../../../api/serviceMenuApi';
import type { ServiceMenu, ServiceMenuRequest } from '../../../types';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export const MenuManagementPage: React.FC = () => {
  const [menus, setMenus] = useState<ServiceMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<ServiceMenu | null>(null);

  const [formData, setFormData] = useState<ServiceMenuRequest>({
    name: '',
    description: '',
    durationMinutes: 30,
    price: 0,
  });

  const fetchMenus = async () => {
    setLoading(true);
    setError('');

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

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMenu) {
        await serviceMenuApi.update(editingMenu.id, formData);
        toast.success('メニューを更新しました');
      } else {
        await serviceMenuApi.create(formData);
        toast.success('メニューを作成しました');
      }
      setDialogOpen(false);
      setEditingMenu(null);
      setFormData({ name: '', description: '', durationMinutes: 30, price: 0 });
      fetchMenus();
    } catch (error: unknown) {
      console.error('メニュー操作に失敗しました', error);
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('メニュー操作に失敗しました');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await serviceMenuApi.delete(id);
      toast.success('メニューを削除しました');
      fetchMenus();
    } catch (error: unknown) {
      console.error('メニュー削除に失敗しました', error);
      if (typeof error === 'object' && error !== null && 'message' in error) {
        toast.error((error as { message: string }).message);
      } else {
        toast.error('メニュー削除に失敗しました');
      }
    }
  };

  const handleEdit = (menu: ServiceMenu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      description: menu.description,
      durationMinutes: menu.durationMinutes,
      price: menu.price,
    });
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingMenu(null);
    setFormData({ name: '', description: '', durationMinutes: 30, price: 0 });
    setDialogOpen(true);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1>メニュー管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              新規メニュー作成
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingMenu ? 'メニュー編集' : '新規メニュー作成'}</DialogTitle>
                <DialogDescription>メニューの情報を入力してください</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">メニュー名</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">所要時間（分）</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })
                      }
                      required
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">料金（円）</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">{editingMenu ? '更新' : '作成'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && menus.length === 0 && (
        <Alert className="mb-6">
          <AlertDescription>メニューがありません。新規作成してください。</AlertDescription>
        </Alert>
      )}

      {!error && menus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map((menu) => (
            <Card key={menu.id}>
              <CardHeader>
                <CardTitle>{menu.name}</CardTitle>
                <CardDescription>{menu.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">所要時間</p>
                    <p>{menu.durationMinutes}分</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">料金</p>
                    <p>¥{menu.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEdit(menu)} className="flex-1">
                    編集
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        削除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>メニューを削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          この操作は取り消せません。本当に削除してもよろしいですか？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(menu.id)}>
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
