import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { User } from '../../types';
import { authApi } from '../../api/authApi';
import { Button } from './ui/button';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      onLogout();
      navigate('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <h1>予約システム</h1>
          </Link>

          <nav className="flex items-center gap-4">
            {!user && (
              <>
                <Link to="/">
                  <Button variant="ghost">予約枠一覧</Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost">ログイン</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default">新規登録</Button>
                </Link>
              </>
            )}

            {user && user.role === 'USER' && (
              <>
                <Link to="/">
                  <Button variant="ghost">予約枠一覧</Button>
                </Link>
                <Link to="/reservations/my">
                  <Button variant="ghost">自分の予約</Button>
                </Link>
                <Link to="/reservations/history">
                  <Button variant="ghost">予約履歴</Button>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{user.name}</span>
                  <Button variant="outline" onClick={handleLogout}>
                    ログアウト
                  </Button>
                </div>
              </>
            )}

            {user && user.role === 'STAFF' && (
              <>
                <Link to="/staff">
                  <Button variant="ghost">ダッシュボード</Button>
                </Link>
                <Link to="/staff/menus">
                  <Button variant="ghost">メニュー管理</Button>
                </Link>
                <Link to="/staff/slots">
                  <Button variant="ghost">予約枠管理</Button>
                </Link>
                <Link to="/staff/reservations">
                  <Button variant="ghost">全予約一覧</Button>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{user.name} (Staff)</span>
                  <Button variant="outline" onClick={handleLogout}>
                    ログアウト
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
