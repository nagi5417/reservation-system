import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reservationApi } from "../api/reservationApi";
import { serviceMenuApi } from "../api/serviceMenuApi";
import { slotApi } from "../api/slotApi";
import type { Reservation, ServiceMenu, Slot } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

export const StaffDashboardPage: React.FC = () => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [menus, setMenus] = useState<ServiceMenu[]>([]);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError("");

        try {
            // 3つのAPIを並行で取得
            const [reservationsData, menusData, slotsData] = await Promise.all([
                reservationApi.getAll(),
                serviceMenuApi.getAll(),
                slotApi.getAll(),
            ]);

            setReservations(reservationsData);
            setMenus(menusData);
            setSlots(slotsData);
        } catch (error) {
            console.error("ダッシュボードデータの取得に失敗しました", error);
            setError("ダッシュボードデータの取得に失敗しました。もう一度お試しください。");
        } finally {
            setLoading(false);
        }
    };

    // 統計情報の計算
    const totalReservations = reservations.length;
    const activeReservations = reservations.filter(r => r.status === "RESERVED").length;
    const totalMenus = menus.length;
    const totalSlots = slots.length;

    // 最近の予約（新しい順に5件）
    const recentReservations = [...reservations]
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5);
    
    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                スタッフダッシュボード
            </h1>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* 統計情報カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg text-blue-600">予約数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{activeReservations}</p>
                        <p className="text-sm text-gray-600">全体: {totalReservations}件</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg text-green-600">メニュー数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalMenus}</p>
                        <p className="text-sm text-gray-600">登録メニュー</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-lg text-purple-600">予約枠数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalSlots}</p>
                        <p className="text-sm text-gray-600">登録予約枠</p>
                    </CardContent>
                </Card>
            </div>

            {/* 最近の予約一覧 */}
            <Card>
                <CardHeader>
                    <CardTitle>最近の予約</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentReservations.length === 0 ? (
                        <p className="text-gray-600">予約はありません</p>
                    ) : (
                        <div className="space-y-3">
                            {recentReservations.map((reservation) => (
                                <div
                                    key={reservation.id}
                                    className="flex justify-between items-center border-b pb-3 last:border-b-0"
                                >
                                    <div>
                                        <p className="font-semibold">{reservation.serviceMenuName}</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDateTime(reservation.startTime)}
                                        </p>
                                    </div>
                                    <div>
                                        <span
                                            className={`text-sm font-semibold ${
                                                reservation.status === "RESERVED"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {reservation.status === "RESERVED" ? "予約中" : "キャンセル"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 管理ページへのリンク */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <Link to="/staff/menus">
                    <Button variant="outline" className="w-full">
                        メニュー管理
                    </Button>
                </Link>
                <Link to="/staff/slots">
                    <Button variant="outline" className="w-full">
                        予約枠管理
                    </Button>
                </Link>
                <Link to="/staff/reservations">
                    <Button variant="outline" className="w-full">
                        全予約一覧
                    </Button>
                </Link>
            </div>
        </div>
    );
};