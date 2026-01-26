import React from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "../types";
import { authApi } from "../api/authApi";

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
            navigate("/");
        } catch (error) {
            console.error("ログアウトエラー", error);
        }
    };

    return (
        <header style={styles.header}>
            <div style={styles.container}>
                <Link to="/" style={styles.logo}>
                    <h1>予約システム</h1>
                </Link>
                <nav style={styles.nav}>
                    {!user && (
                        <>
                            <Link to="/" style={styles.link}>予約枠一覧</Link>
                            <Link to="/login" style={styles.link}>ログイン</Link>
                            <Link to="/signup" style={styles.buttonPrimary}>新規登録</Link>
                        </>
                    )}

                    {user && user.role === 'USER' && (
                    <>
                        <Link to="/" style={styles.link}>予約枠一覧</Link>
                        <Link to="/reservations/my" style={styles.link}>自分の予約</Link>
                        <Link to="/reservations/history" style={styles.link}>予約履歴</Link>
                        <span style={styles.userName}>{user.name}</span>
                        <button onClick={handleLogout} style={styles.buttonOutline}>
                        ログアウト
                        </button>
                    </>
                    )}

                    {user && user.role === 'STAFF' && (
                    <>
                        <Link to="/staff" style={styles.link}>ダッシュボード</Link>
                        <Link to="/staff/menus" style={styles.link}>メニュー管理</Link>
                        <Link to="/staff/slots" style={styles.link}>予約枠管理</Link>
                        <Link to="/staff/reservations" style={styles.link}>全予約一覧</Link>
                        <span style={styles.userName}>{user.name} (Staff)</span>
                        <button onClick={handleLogout} style={styles.buttonOutline}>
                        ログアウト
                        </button>
                    </>
                    )}
                </nav>
            </div>
        </header>
    );
};

const styles = {
    header: {
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#fff',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      textDecoration: 'none',
      color: '#111',
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    link: {
      textDecoration: 'none',
      color: '#374151',
      padding: '8px 12px',
      borderRadius: '4px',
      transition: 'background-color 0.2s',
    },
    userName: {
      fontSize: '14px',
      color: '#6b7280',
    },
    buttonPrimary: {
      textDecoration: 'none',
      backgroundColor: '#3b82f6',
      color: '#fff',
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
    },
    buttonOutline: {
      backgroundColor: '#fff',
      color: '#374151',
      padding: '8px 16px',
      borderRadius: '4px',
      border: '1px solid #d1d5db',
      cursor: 'pointer',
    },
  };