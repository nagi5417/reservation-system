import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar, Users, ListChecks, Settings } from 'lucide-react';

export const StaffDashboardPage: React.FC = () => {
  const menuItems = [
    {
      title: 'メニュー管理',
      description: 'サービスメニューの作成・編集・削除',
      icon: Settings,
      link: '/staff/menus',
      color: 'text-blue-600',
    },
    {
      title: '予約枠管理',
      description: '予約枠の作成・編集・削除',
      icon: Calendar,
      link: '/staff/slots',
      color: 'text-green-600',
    },
    {
      title: '全予約一覧',
      description: 'すべての予約を確認・管理',
      icon: ListChecks,
      link: '/staff/reservations',
      color: 'text-purple-600',
    },
    {
      title: '予約枠一覧',
      description: '公開されている予約枠を確認',
      icon: Users,
      link: '/',
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2">スタッフダッシュボード</h1>
        <p className="text-muted-foreground">予約システムの管理メニュー</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.link} to={item.link}>
              <Card className="hover:shadow-lg transition-shadow h-full cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full">
                    開く
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link to="/staff/menus">
              <Button variant="outline">新規メニュー作成</Button>
            </Link>
            <Link to="/staff/slots/create">
              <Button variant="outline">新規予約枠作成</Button>
            </Link>
            <Link to="/staff/reservations">
              <Button variant="outline">予約を確認</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
