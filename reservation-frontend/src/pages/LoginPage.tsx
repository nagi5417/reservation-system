import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, Chrome, CheckCircle } from "lucide-react";
import axios from "axios";
import { authApi } from "../api/authApi";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // メール認証完了のクエリパラメータをチェック
    useEffect(() => {
        const verified = searchParams.get("verified");
        const verifyError = searchParams.get("error");

        if (verified === "true") {
            setSuccess("メールアドレスの認証が完了しました。ログインしてください。");
        } else if (verifyError === "verification_failed") {
            setError("メール認証に失敗しました。リンクが無効または期限切れです。");
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await authApi.login({ email, password});
            login(user);
            navigate(user.role === "STAFF" ? "/staff" : "/");
        } catch (error) {
            // Axiosエラーの型ガードを使用
            if (axios.isAxiosError(error)) {
                // バックエンドから返されたエラーメッセージを表示
                const errorMessage = error.response?.data?.message || "ログインに失敗しました";
                setError(errorMessage);
            } else {
                // Axiosエラーではない予期しないエラー
                setError("予期しないエラーが発生しました");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        authApi.googleLogin();
    }

    return (
        <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md shadow-xl hover:shadow-2xl transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4">
                <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ログイン
                    </CardTitle>
                    <CardDescription className="text-center text-base">
                        予約システムにログインして予約を管理
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {success && (
                            <Alert className="border-green-500 bg-green-50 animate-in slide-in-from-top-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700">{success}</AlertDescription>
                            </Alert>
                        )}
                        {error && (
                            <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

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
                            <Label htmlFor="password" className="text-sm font-medium">パスワード</Label>
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

                        <Button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                            disabled={loading}
                        >
                            {loading ? "ログイン中..." : "ログイン"}
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-gray-500 font-medium">または</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 border-2 hover:bg-gray-50 transition-all duration-300"
                            onClick={handleGoogleLogin}
                        >
                            <Chrome className="mr-2 h-5 w-5" />
                            Googleでログイン
                        </Button>

                        <div className="text-center text-sm pt-4">
                            <span className="text-gray-600">アカウントをお持ちでない方は </span>
                            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                                新規登録はこちら
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};