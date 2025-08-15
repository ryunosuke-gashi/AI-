'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Target } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // ログイン
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.user) {
          // ログイン成功
          window.location.href = '/';
        }
      } else {
        // サインアップ
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // 新しいユーザーレコードを作成（エラーは無視）
          await supabase
            .from('users')
            .upsert([
              {
                id: data.user.id,
                email: data.user.email,
                total_points: 0
              }
            ], { 
              onConflict: 'id' 
            });

          setMessage('アカウントが作成されました！ログインしてください。');
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      setMessage(error.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full mb-6">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-light text-gray-900 mb-2 tracking-wide">
            {isLogin ? 'ログイン' : 'アカウント作成'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isLogin ? 'アカウントにサインインしてください' : '新しいアカウントを作成してください'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              required
              minLength={6}
            />
          </div>

          {message && (
            <div className={`text-sm p-3 rounded-lg ${
              message.includes('エラー') || message.includes('失敗') 
                ? 'bg-red-50 text-red-600 border border-red-100' 
                : 'bg-green-50 text-green-600 border border-green-100'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
                <span>{isLogin ? 'ログイン中...' : 'アカウント作成中...'}</span>
              </div>
            ) : (
              isLogin ? 'ログイン' : 'アカウント作成'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
              setEmail('');
              setPassword('');
            }}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            {isLogin 
              ? 'アカウントをお持ちでない方はこちら' 
              : '既にアカウントをお持ちの方はこちら'
            }
          </button>
        </div>
      </div>
    </div>
  );
}