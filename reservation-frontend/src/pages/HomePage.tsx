import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { slotApi } from "../api/slotApi";
import { serviceMenuApi } from "../api/serviceMenuApi";
import type { Slot, ServiceMenu } from "../types";
import { formatDateTime } from "../utils/dateUtils";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";

export const HomePage: React.FC = () => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [menus, setMenus] = useState<ServiceMenu[]>([]);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [selectedMenuId, setSelectedMenuId] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchSlots = async () => {
        setLoading(true);
        setError("");

        try {
            const params: { from?: string; to?: string; menuId?: number } = {};
            if (fromDate) params.from = new Date(fromDate).toISOString();
            if (toDate) params.to = new Date(toDate).toISOString();
            if (selectedMenuId && selectedMenuId !== "all") params.menuId = parseInt(selectedMenuId);

            const data = await slotApi.getAll(params);
            setSlots(data);
        } catch (error) {
            console.error("予約枠の取得に失敗しました", error);
            setError("予約枠の取得に失敗しました。もう一度お試しください。");
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMenus = async () => {
        try {
            const data = await serviceMenuApi.getAll();
            setMenus(data);
        } catch (error) {
            console.error("メニューの取得に失敗しました", error);
            setMenus([]);
        }
    };

    useEffect(() => {
        fetchSlots();
        fetchMenus();
    }, []);

    const handleSearch = () => {
        fetchSlots();
    };

    const getAvailableSeats = (slot: Slot): number => {
        return slot.availableSeats;
    };

    return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            予約可能な枠一覧
          </h1>
  
          <Card className="mb-6 shadow-lg">
            <CardHeader>
              <CardTitle>検索フィルタ</CardTitle>
              <CardDescription>日付やメニューで絞り込み</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">開始日</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
  
                <div className="space-y-2">
                  <Label htmlFor="toDate">終了日</Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
  
                <div className="space-y-2">
                  <Label htmlFor="menu">メニュー</Label>
                  <Select value={selectedMenuId} onValueChange={setSelectedMenuId}>
                    <SelectTrigger id="menu">
                      <SelectValue placeholder="すべて" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      {Array.isArray(menus) && menus.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id.toString()}>
                          {menu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
  
                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    検索
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
  
          {loading && <LoadingSpinner />}
  
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
  
          {!loading && !error && Array.isArray(slots) && slots.length === 0 && (
            <Alert className="mb-4">
              <AlertDescription>予約可能な枠がありません</AlertDescription>
            </Alert>
          )}
  
          {!loading && !error && Array.isArray(slots) && slots.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map((slot) => (
                <Card key={slot.id} className="hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg">{slot.serviceMenuName}</CardTitle>
                    <CardDescription>
                      {formatDateTime(slot.startTime)} 〜 {formatDateTime(slot.endTime).split(' ')[1]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        残席: <span className="font-semibold text-lg">{getAvailableSeats(slot)}</span> / {slot.capacity}
                      </p>
                      <p className="text-sm">
                        ステータス:{' '}
                        <span
                          className={
                            slot.status === 'AVAILABLE'
                              ? 'text-green-600 font-semibold'
                              : slot.status === 'FULL'
                              ? 'text-red-600 font-semibold'
                              : 'text-yellow-600 font-semibold'
                          }
                        >
                          {slot.status === 'AVAILABLE' ? '予約可能' : slot.status === 'FULL' ? '満員' : '一部予約済'}
                        </span>
                      </p>
                      <Link to={`/slots/${slot.id}`}>
                        <Button
                          className="w-full mt-2"
                          disabled={slot.status === 'FULL'}
                          variant={slot.status === 'FULL' ? 'secondary' : 'default'}
                        >
                          詳細を見る
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
}