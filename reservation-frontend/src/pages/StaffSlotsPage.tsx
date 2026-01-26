import React, { useState, useEffect } from "react";
import axios from "axios";
import { slotApi } from "../api/slotApi";
import { serviceMenuApi } from "../api/serviceMenuApi";
import type { Slot, SlotRequest, ServiceMenu } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

export const StaffSlotsPage: React.FC = () => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [menus, setMenus] = useState<ServiceMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
    const [formData, setFormData] = useState<SlotRequest>({
        serviceMenuId: 0,
        startTime: "",
        endTime: "",
        capacity: 1,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError("");

        try {
            const [slotsData, menusData] = await Promise.all([
                slotApi.getAll(),
                serviceMenuApi.getAll(),
            ]);
            setSlots(slotsData);
            setMenus(menusData);
        } catch (error) {
            console.error("データの取得に失敗しました", error);
            // Axiosエラーの型ガードを使用
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || "データの取得に失敗しました。もう一度お試しください。";
                setError(errorMessage);
            } else {
                setError("予期しないエラーが発生しました");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        setFormMode("create");
        setEditingSlot(null);
        setFormData({
            serviceMenuId: 0,
            startTime: "",
            endTime: "",
            capacity: 1,
        });
        setShowForm(true);
    };

    const handleEditClick = (slot: Slot) => {
        setFormMode("edit");
        setEditingSlot(slot);
        setFormData({
            serviceMenuId: slot.serviceMenuId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            capacity: slot.capacity,
        });
        setShowForm(true);
    };

    const handleCancelClick = () => {
        setShowForm(false);
        setEditingSlot(null);
        setFormData({
            serviceMenuId: 0,
            startTime: "",
            endTime: "",
            capacity: 1,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (formMode === "create") {
                await slotApi.create(formData);
                alert("予約枠を作成しました！");
            } else {
                if (!editingSlot) return;
                await slotApi.update(editingSlot.id, formData);
                alert("予約枠を更新しました！");
            }

            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error("予約枠の保存に失敗しました", error);
            // Axiosエラーの型ガードを使用
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || "予約枠の保存に失敗しました。もう一度お試しください。";
                setError(errorMessage);
                alert(errorMessage);
            } else {
                const errorMessage = "予期しないエラーが発生しました";
                setError(errorMessage);
                alert(errorMessage);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("本当にこの予約枠を削除しますか？")) {
            return;
        }

        try {
            await slotApi.delete(id);
            alert("予約枠を削除しました");
            fetchData();
        } catch (error) {
            console.error("予約枠の削除に失敗しました", error);
            // Axiosエラーの型ガードを使用
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || "予約枠の削除に失敗しました。もう一度お試しください。";
                setError(errorMessage);
                alert(errorMessage);
            } else {
                const errorMessage = "予期しないエラーが発生しました";
                setError(errorMessage);
                alert(errorMessage);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "AVAILABLE":
                return "text-green-600";
            case "FULL":
                return "text-red-600";
            case "CANCELLED":
                return "text-gray-600";
            default:
                return "text-yellow-600";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "AVAILABLE":
                return "予約可能";
            case "FULL":
                return "満員";
            case "CANCELLED":
                return "キャンセル";
            default:
                return status;
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    予約枠管理
                </h1>
                <Button onClick={handleCreateClick} disabled={showForm}>
                    新規予約枠作成
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
                            {formMode === "create" ? "新規予約枠作成" : "予約枠編集"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="serviceMenuId">サービスメニュー</Label>
                                <Select
                                    value={formData.serviceMenuId.toString()}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, serviceMenuId: Number(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="メニューを選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {menus.map((menu) => (
                                            <SelectItem key={menu.id} value={menu.id.toString()}>
                                                {menu.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="startTime">開始日時</Label>
                                <Input
                                    id="startTime"
                                    type="datetime-local"
                                    value={formData.startTime}
                                    onChange={(e) =>
                                        setFormData({ ...formData, startTime: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="endTime">終了日時</Label>
                                <Input
                                    id="endTime"
                                    type="datetime-local"
                                    value={formData.endTime}
                                    onChange={(e) =>
                                        setFormData({ ...formData, endTime: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="capacity">定員</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) =>
                                        setFormData({ ...formData, capacity: Number(e.target.value) })
                                    }
                                    required
                                    min="1"
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

            {/* 予約枠一覧 */}
            {slots.length === 0 ? (
                <Alert>
                    <AlertDescription>予約枠はありません</AlertDescription>
                </Alert>
            ) : (
                <div className="space-y-4">
                    {slots.map((slot) => (
                        <Card key={slot.id} className="hover:shadow-lg transition-shadow duration-300">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-2">{slot.serviceMenuName}</h3>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p>開始: {formatDateTime(slot.startTime)}</p>
                                            <p>終了: {formatDateTime(slot.endTime)}</p>
                                            <p>定員: {slot.capacity}人</p>
                                            <p>
                                                ステータス:{" "}
                                                <span className={`font-semibold ${getStatusColor(slot.status)}`}>
                                                    {getStatusText(slot.status)}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleEditClick(slot)}
                                            variant="outline"
                                            size="sm"
                                            disabled={showForm}
                                        >
                                            編集
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(slot.id)}
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
}