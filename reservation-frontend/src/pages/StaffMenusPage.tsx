import React, { useState, useEffect } from "react";
import axios from "axios";
import { serviceMenuApi } from "../api/serviceMenuApi";
import type { ServiceMenu, ServiceMenuRequest } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Input } from "../components/ui/input";
import { Label } from "@radix-ui/react-label";

export const StaffMenusPage: React.FC = () => {
    const [menus, setMenus] = useState<ServiceMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editingMenu, setEditingMenu] = useState<ServiceMenu | null>(null);
    const [formData, setFormData] = useState<ServiceMenuRequest>({
        name: "",
        description: "",
        durationMinutes: 0,
        price: 0,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMenus();
    }, []);

    const fetchMenus = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await serviceMenuApi.getAll();
            setMenus(data);
        } catch (error) {
            console.error("メニュー一覧の取得に失敗しました", error);
            setError("メニュー一覧の取得に失敗しました。もう一度お試しください。");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        setFormMode("create");
        setEditingMenu(null);
        setFormData({
            name: "",
            description: "",
            durationMinutes: 0,
            price: 0,
        });
        setShowForm(true);
    };

    const handleEditClick = (menu: ServiceMenu) => {
        setFormMode("edit");
        setEditingMenu(menu);
        setFormData({
            name: menu.name,
            description: menu.description,
            durationMinutes: menu.durationMinutes,
            price: menu.price,
        });
        setShowForm(true);
    };

    const handleCancelClick = () => {
        setShowForm(false);
        setEditingMenu(null);
        setFormData({
            name: "",
            description: "",
            durationMinutes: 0,
            price: 0,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (formMode === "create") {
                await serviceMenuApi.create(formData);
                alert("メニューを作成しました！");
            } else {
                if (!editingMenu) return;
                await serviceMenuApi.update(editingMenu.id, formData);
                alert("メニューを更新しました！");
            }

            setShowForm(false);
            fetchMenus();
        } catch (error) {
            console.error("メニューの保存に失敗しました", error);
            // Axiosエラーの型ガードを使用
            if (axios.isAxiosError(error)) {
                // バックエンドから返されたエラーメッセージを表示
                const errorMessage = error.response?.data?.message || "メニューの保存に失敗しました。もう一度お試しください。";
                setError(errorMessage);
                alert(errorMessage);
            } else {
                // Axiosエラーではない予期しないエラー
                const errorMessage = "予期しないエラーが発生しました";
                setError(errorMessage);
                alert(errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`「${name}」を削除しますか？この操作は取り消せません。`)) {
            return;
        }

        try {
            await serviceMenuApi.delete(id);
            alert("メニューを削除しました");
            fetchMenus();
        } catch (error) {
            console.error("メニューの削除に失敗しました", error);
            // Axiosエラーの型ガードを使用
            if (axios.isAxiosError(error)) {
                // バックエンドから返されたエラーメッセージを表示
                const errorMessage = error.response?.data?.message || "メニューの削除に失敗しました。もう一度お試しください。";
                setError(errorMessage);
                alert(errorMessage);
            } else {
                // Axiosエラーではない予期しないエラー
                const errorMessage = "予期しないエラーが発生しました";
                setError(errorMessage);
                alert(errorMessage);
            }
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    メニュー管理
                </h1>
                <Button onClick={handleCreateClick} disabled={showForm}>
                    新規メニュー作成
                </Button>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* フォーム表示 */}
            {showForm && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>
                            {formMode === "create" ? "新規メニュー作成" : "メニュー編集"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">メニュー名</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">説明</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="durationMinutes">所要時間（分）</Label>
                                <Input
                                    id="durationMinutes"
                                    type="number"
                                    value={formData.durationMinutes}
                                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                                    required
                                    min="1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="price">料金（円）</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    required
                                    min="0"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? "保存中..." : "保存"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancelClick}
                                    disabled={submitting}
                                >
                                    キャンセル
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* メニュー一覧 */}
            {menus.length === 0 ? (
                <Alert>
                    <AlertDescription>メニューはありません</AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-4">
                    {menus.map((menu) => (
                        <Card key={menu.id} className="hover:shadow-lg transition-shadow duration-300">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-2">{menu.name}</h3>
                                        <p className="text-gray-600 mb-2">{menu.description}</p>
                                        <div className="flex gap-4 text-sm text-gray-600">
                                            <span>所要時間: {menu.durationMinutes}分</span>
                                            <span>料金: ¥{menu.price.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleEditClick(menu)}
                                            variant="outline"
                                            size="sm"
                                            disabled={showForm}
                                        >
                                            編集
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(menu.id, menu.name)}
                                            variant="destructive"
                                            size="sm"
                                            disabled={showForm}
                                        >
                                            削除
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};