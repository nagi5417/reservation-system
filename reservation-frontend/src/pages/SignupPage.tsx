import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, CheckCircle } from "lucide-react";
import axios from "axios";
import { authApi } from '../api/authApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export const SignupPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // バリデーション
    if (password.length < 8) {
        setError('パスワードは8文字以上である必要があります');
        return;
      }
  
      if (password !== confirmPassword) {
        setError('パスワードが一致しません');
        return;
      }

      setLoading(true);

      try {
        await authApi.signup({ name, email, password });
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } catch (error) {
        // Axiosエラーの型ガードを使用
        if (axios.isAxiosError(error)) {
          // バックエンドから返されたエラーメッセージを表示
          const errorMessage = error.response?.data?.message || '登録に失敗しました';
          setError(errorMessage);
        } else {
          // Axiosエラーではない予期しないエラー
          setError('予期しないエラーが発生しました');
        }
      } finally {
        setLoading(false);
      }
    }

    return (
        <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md shadow-xl hover:shadow-2xl transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                新規登録
              </CardTitle>
              <CardDescription className="text-center text-base">
                予約システムのアカウントを作成
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <Alert className="bg-green-50 border-green-200 animate-in slide-in-from-top-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-800 ml-2">
                    登録が完了しました。確認メールを送信しました。メールを確認してアカウントを有効化してください。
                    <br />
                    <span className="font-semibold">3秒後にログイン画面に移動します...</span>
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">氏名</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="山田太郎"
                        className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">メールアドレス</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="user@example.com"
                        className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">パスワード（8文字以上）</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="パスワードを入力"
                        className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">パスワード（確認）</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="パスワードを再入力"
                        className="pl-10 h-11 transition-all focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg mt-6"
                    disabled={loading}
                  >
                    {loading ? '登録中...' : '登録する'}
                  </Button>

                  <div className="text-center text-sm pt-4">
                    <span className="text-gray-600">既にアカウントをお持ちの方は </span>
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                      ログインはこちら
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      );
}