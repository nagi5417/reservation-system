import React, { useState, useEffect } from "react";
  import { reservationApi } from "../api/reservationApi";
  import type { Reservation } from "../types";
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

  export const StaffReservationsPage: React.FC = () => {
      const [reservations, setReservations] = useState<Reservation[]>([]);
      const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState("");
      const [statusFilter, setStatusFilter] = useState<string>("all");
      const [searchQuery, setSearchQuery] = useState("");

      useEffect(() => {
          fetchReservations();
      }, []);

      useEffect(() => {
          filterReservations();
      }, [reservations, statusFilter, searchQuery]);

      const fetchReservations = async () => {
          setLoading(true);
          setError("");

          try {
              const data = await reservationApi.getAll();
              setReservations(data);
          } catch (error) {
              console.error("予約一覧の取得に失敗しました", error);
              setError("予約一覧の取得に失敗しました。もう一度お試しください。");
          } finally {
              setLoading(false);
          }
      };

      const filterReservations = () => {
          let filtered = [...reservations];

          // ステータスフィルタ
          if (statusFilter !== "all") {
              filtered = filtered.filter((r) => r.status === statusFilter);
          }

          // 検索フィルタ
          if (searchQuery) {
              const query = searchQuery.toLowerCase();
              filtered = filtered.filter(
                  (r) =>
                      r.userName.toLowerCase().includes(query) ||
                      r.serviceMenuName.toLowerCase().includes(query)
              );
          }

          // 新しい順にソート
          filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

          setFilteredReservations(filtered);
      };

      const getStatusColor = (status: string) => {
          switch (status) {
              case "RESERVED":
                  return "text-green-600";
              case "CANCELLED":
                  return "text-red-600";
              default:
                  return "text-gray-600";
          }
      };

      const getStatusText = (status: string) => {
          switch (status) {
              case "RESERVED":
                  return "予約中";
              case "CANCELLED":
                  return "キャンセル済み";
              default:
                  return status;
          }
      };

      if (loading) {
          return <LoadingSpinner />;
      }

      return (
          <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  全予約一覧
              </h1>

              {error && (
                  <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error}</AlertDescription>
                  </Alert>
              )}

              {/* フィルタ・検索 */}
              <Card className="mb-6">
                  <CardHeader>
                      <CardTitle>フィルタ・検索</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <Label htmlFor="status">ステータス</Label>
                              <Select value={statusFilter} onValueChange={setStatusFilter}>
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="all">全て</SelectItem>
                                      <SelectItem value="RESERVED">予約中</SelectItem>
                                      <SelectItem value="CANCELLED">キャンセル済み</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>

                          <div>
                              <Label htmlFor="search">検索（ユーザー名・メニュー名）</Label>
                              <Input
                                  id="search"
                                  placeholder="検索..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                              />
                          </div>
                      </div>
                  </CardContent>
              </Card>

              {/* 予約一覧 */}
              {filteredReservations.length === 0 ? (
                  <Alert>
                      <AlertDescription>
                          {searchQuery || statusFilter !== "all"
                              ? "条件に一致する予約はありません"
                              : "予約はありません"}
                      </AlertDescription>
                  </Alert>
              ) : (
                  <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                          {filteredReservations.length}件の予約が見つかりました
                      </p>
                      {filteredReservations.map((reservation) => (
                          <Card
                              key={reservation.id}
                              className="hover:shadow-lg transition-shadow duration-300"
                          >
                              <CardContent className="pt-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                          <h3 className="text-xl font-bold mb-2">
                                              {reservation.serviceMenuName}
                                          </h3>
                                          <div className="space-y-1 text-sm text-gray-600">
                                              <p>ユーザー: {reservation.userName}</p>
                                              <p>開始: {formatDateTime(reservation.startTime)}</p>
                                              <p>終了: {formatDateTime(reservation.endTime)}</p>
                                              {reservation.notes && (
                                                  <p className="mt-2">
                                                      <span className="font-semibold">備考:</span>{" "}
                                                      {reservation.notes}
                                                  </p>
                                              )}
                                          </div>
                                      </div>
                                      <div className="flex flex-col justify-between items-end">
                                          <span
                                              className={`text-lg font-semibold ${getStatusColor(
                                                  reservation.status
                                              )}`}
                                          >
                                              {getStatusText(reservation.status)}
                                          </span>
                                          <p className="text-xs text-gray-500">
                                              予約ID: {reservation.id}
                                          </p>
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