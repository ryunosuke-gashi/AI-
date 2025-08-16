'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Clock, MapPin, Trophy, Check, Target, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Action {
  title: string;
  description: string;
  difficulty: string;
  points: number;
}

interface CompletedAction extends Action {
  id?: string;
  timestamp: string;
}

const actions: Record<string, Action[]> = {
  '5min-home': [
    {
      title: '部屋の一角を5分で整理する',
      description: 'デスク周り、ベッドサイド、玄関など気になる場所を一つ選んで集中的に片付けてみましょう',
      difficulty: '簡単 • 10pt',
      points: 10
    },
    {
      title: '好きな音楽に合わせてストレッチ',
      description: '1曲分の時間で肩や首をほぐし、軽く体を伸ばして血行を良くしましょう',
      difficulty: '簡単 • 10pt',
      points: 10
    },
    {
      title: '今日の良かったことを3つ書き出す',
      description: 'スマホのメモ帳や紙に、今日あった小さな良いことを記録してみましょう',
      difficulty: '簡単 • 10pt',
      points: 10
    },
    {
      title: '窓を開けて深呼吸を10回',
      description: '新鮮な空気を取り込んで、ゆっくりと呼吸を整えてリフレッシュしましょう',
      difficulty: '簡単 • 10pt',
      points: 10
    }
  ],
  '5min-outside': [
    {
      title: '最寄りのコンビニまで歩く',
      description: '何かを買う必要がなくても、軽い散歩として外の空気を感じながら歩いてみましょう',
      difficulty: '簡単 • 15pt',
      points: 15
    },
    {
      title: '近所の神社やお寺を見つけて参拝',
      description: 'Google Mapで近くの静かな場所を探して、心を落ち着ける時間を作りましょう',
      difficulty: '簡単 • 15pt',
      points: 15
    }
  ],
  '15min-home': [
    {
      title: '新しいレシピを1つ検索して保存',
      description: 'クックパッドやYouTubeで気になる料理を見つけて、今度作る用にブックマークしましょう',
      difficulty: '普通 • 20pt',
      points: 20
    },
    {
      title: '久しぶりの友人に近況報告のメッセージ',
      description: 'しばらく連絡を取っていない人に、元気にしているかメッセージを送ってみましょう',
      difficulty: '普通 • 20pt',
      points: 20
    },
    {
      title: '15分間の瞑想にチャレンジ',
      description: 'ガイド付き瞑想アプリやYouTubeを使って、心を落ち着ける時間を作りましょう',
      difficulty: '普通 • 20pt',
      points: 20
    }
  ],
  '15min-outside': [
    {
      title: '新宿駅から代々木駅まで歩く',
      description: 'いつも電車で通る区間を歩いて、新しい発見や街の変化を感じてみましょう',
      difficulty: '普通 • 25pt',
      points: 25
    },
    {
      title: '近所のカフェで新しいドリンクを試す',
      description: 'いつもと違うメニューに挑戦して、新しい味を発見してみましょう',
      difficulty: '普通 • 25pt',
      points: 25
    }
  ],
  '30min-home': [
    {
      title: '今月の支出を整理して見直す',
      description: 'レシートや家計簿アプリを確認して、無駄な出費がないかチェックしてみましょう',
      difficulty: '普通 • 30pt',
      points: 30
    },
    {
      title: 'クローゼットの服を季節ごとに整理',
      description: '着なくなった服を分けて、コーディネートしやすく整理してみましょう',
      difficulty: '普通 • 30pt',
      points: 30
    }
  ],
  'long-outside': [
    {
      title: '井の頭公園を一周歩く',
      description: 'ゆっくりと自然を楽しみながら、公園内をのんびりと散策してみましょう',
      difficulty: '難しい • 50pt',
      points: 50
    },
    {
      title: '美術館や博物館を1つ訪れる',
      description: '上野や六本木のミュージアムで新しいインスピレーションを得てみましょう',
      difficulty: '難しい • 50pt',
      points: 50
    }
  ]
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [timeSelect, setTimeSelect] = useState('');
  const [locationSelect, setLocationSelect] = useState('');
  const [currentAction, setCurrentAction] = useState<Action | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completedActions, setCompletedActions] = useState<CompletedAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // 初期化状態を追跡

  const initializeUserData = useCallback(async (userId: string, userEmail?: string) => {
    if (isInitialized) {
      console.log('📊 Already initialized, skipping...');
      return;
    }
    
    console.log('📊 Starting user data initialization for:', userId);
    setIsInitialized(true);
    
    try {
      // まず簡単な接続テスト
      console.log('📊 Testing basic Supabase connection...');
      const { data: testData, error: testError } = await supabase.from('users').select('count');
      console.log('📊 Connection test result:', { testData, testError: testError?.message });
      
      if (testError) {
        console.error('📊 Basic connection failed:', testError);
        throw testError;
      }
      
      console.log('📊 Connection successful, fetching user data...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('📊 User data result:', { hasData: !!userData, error: userError?.message });

      // ユーザーデータが存在しない場合は作成
      if (userError && userError.code === 'PGRST116') {
        console.log('📊 Creating new user...');
        const { data: newUser } = await supabase
          .from('users')
          .insert([
            {
              id: userId,
              email: userEmail,
              total_points: 0
            }
          ])
          .select()
          .single();

        if (newUser) {
          setTotalPoints(newUser.total_points || 0);
          console.log('📊 New user created with points:', newUser.total_points);
        }
      } else if (userData) {
        setTotalPoints(userData.total_points || 0);
        console.log('📊 Existing user loaded with points:', userData.total_points);
      }

      console.log('📊 Fetching completed actions...');
      const { data: actions } = await supabase
        .from('completed_actions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (actions) {
        setCompletedActions(
          actions.map(action => ({
            title: action.title,
            description: action.description,
            difficulty: action.difficulty,
            points: action.points,
            timestamp: new Date(action.completed_at).toLocaleString(),
            id: action.id
          }))
        );
        console.log('📊 Loaded', actions.length, 'completed actions');
      }
      
      console.log('📊 User data initialization completed successfully');
    } catch (error) {
      console.error('📊 Error during initialization:', error);
      setIsInitialized(false);
    }
  }, [isInitialized]);

  // 認証状態の確認
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Testing new Supabase project');
      console.log('🔍 Environment check:');
      console.log('  - hasSupabaseUrl:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('  - hasSupabaseKey:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      console.log('  - URL preview:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30));
      
      try {
        console.log('🔍 Getting user...');
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('🔍 User result:', { hasUser: !!user, error: error?.message });
        
        if (error) {
          console.error('🔍 Auth error:', error);
          window.location.href = '/auth';
          return;
        }
        
        if (user) {
          console.log('🔍 User found, initializing data...');
          setUser(user);
          await initializeUserData(user.id, user.email || '');
          console.log('🔍 Initialization completed');
        } else {
          console.log('🔍 No user found, redirecting...');
          window.location.href = '/auth';
        }
      } catch (error) {
        console.error('🔍 Auth check error:', error);
        window.location.href = '/auth';
      } finally {
        console.log('🔍 Setting authLoading to false');
        setAuthLoading(false);
      }
    };

    checkAuth();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔍 User signed in, resetting initialization state');
        setIsInitialized(false); // 重要: 再ログイン時はリセット
        setUser(session.user);
        await initializeUserData(session.user.id, session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        console.log('🔍 User signed out, resetting state');
        setUser(null);
        setIsInitialized(false); // サインアウト時もリセット
        window.location.href = '/auth';
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAction = () => {
    if (!timeSelect || !locationSelect) {
      alert('時間と場所を選択してください');
      return;
    }

    setIsLoading(true);
    setCurrentAction(null);

    setTimeout(() => {
      const key = `${timeSelect}-${locationSelect}`;
      let availableActions = actions[key] || [];

      if (availableActions.length === 0) {
        Object.keys(actions).forEach(actionKey => {
          if (actionKey.includes(timeSelect)) {
            availableActions = availableActions.concat(actions[actionKey]);
          }
        });
      }

      if (availableActions.length === 0) {
        availableActions = [
          {
            title: '深呼吸を10回する',
            description: '今いる場所で、ゆっくりと深呼吸をしてリラックスしましょう',
            difficulty: '簡単 • 10pt',
            points: 10
          }
        ];
      }

      const selectedAction = availableActions[Math.floor(Math.random() * availableActions.length)];
      setCurrentAction(selectedAction);
      setIsLoading(false);
    }, 1200);
  };

  const completeAction = async () => {
    if (!currentAction || !user) return;

    try {
      // 完了した行動をデータベースに保存
      const { data } = await supabase
        .from('completed_actions')
        .insert([
          {
            user_id: user.id,
            title: currentAction.title,
            description: currentAction.description,
            difficulty: currentAction.difficulty,
            points: currentAction.points
          }
        ])
        .select()
        .single();

      // ユーザーのポイントを更新
      const newTotalPoints = totalPoints + currentAction.points;
      await supabase
        .from('users')
        .update({ total_points: newTotalPoints })
        .eq('id', user.id);

      // 状態を更新
      setTotalPoints(newTotalPoints);
      setCompletedActions(prev => [
        {
          ...currentAction,
          timestamp: new Date().toLocaleString(),
          id: data?.id
        },
        ...prev
      ]);

      setCurrentAction(null);
      
      setTimeout(() => {
        alert(`🎉 お疲れさまでした！ ${currentAction.points}ポイント獲得！`);
      }, 100);

    } catch (error) {
      console.error('Error completing action:', error);
      alert('保存中にエラーが発生しました。もう一度お試しください。');
    }
  };

  const handleLogout = async () => {
    console.log('🔍 Logging out and resetting state');
    setIsInitialized(false); // ログアウト時にリセット
    await supabase.auth.signOut();
  };

  // 認証確認中のローディング
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未認証の場合は何も表示しない（リダイレクト処理中）
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">      
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl border border-gray-100">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1"></div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-full">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="ログアウト"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h1 className="text-2xl font-light text-gray-900 mb-2 tracking-wide">行動</h1>
            <p className="text-gray-500 text-sm">空いた時間を意味のある行動に変える</p>
            {user.email && (
              <p className="text-gray-400 text-xs mt-2">{user.email}</p>
            )}
          </div>

          {/* Points Display */}
          <div className="bg-gray-900 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center space-x-3">
              <Trophy className="w-6 h-6 text-white" />
              <span className="text-white font-light text-2xl">{totalPoints}</span>
              <span className="text-gray-300 text-sm">ポイント</span>
            </div>
          </div>

          {/* Selectors */}
          <div className="space-y-5 mb-8">
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={timeSelect}
                onChange={(e) => setTimeSelect(e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 appearance-none cursor-pointer"
              >
                <option value="">利用可能な時間</option>
                <option value="5min">5分程度</option>
                <option value="15min">15分程度</option>
                <option value="30min">30分〜1時間</option>
                <option value="long">数時間</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={locationSelect}
                onChange={(e) => setLocationSelect(e.target.value)}
                className="w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 appearance-none cursor-pointer"
              >
                <option value="">現在の場所</option>
                <option value="home">家の中</option>
                <option value="outside">外出可能</option>
                <option value="anywhere">どこでも</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={getAction}
            disabled={isLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-8"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div>
                <span>行動を考えています...</span>
              </div>
            ) : (
              '行動を提案する'
            )}
          </button>

          {/* Action Card */}
          {currentAction && !isLoading && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-4 font-medium">
                {currentAction.difficulty}
              </div>
              <div className="text-xl font-light text-gray-900 mb-4 leading-relaxed">
                {currentAction.title}
              </div>
              <div className="text-gray-600 leading-relaxed mb-6 text-sm">
                {currentAction.description}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={completeAction}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-light py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Check className="w-5 h-5" />
                  <span>完了</span>
                </button>
                <button
                  onClick={getAction}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-light py-3 px-4 rounded-xl transition-all duration-200 border border-gray-200"
                >
                  別の提案
                </button>
              </div>
            </div>
          )}

          {/* Completed Actions */}
          {completedActions.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="text-lg font-light text-gray-900 mb-5 flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-gray-400" />
                <span>最近の完了</span>
              </h3>
              <div className="space-y-3">
                {completedActions
                  .slice(0, 5)
                  .map((action, index) => (
                    <div
                      key={action.id || index}
                      className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100"
                    >
                      <span className="text-gray-800 text-sm font-light truncate flex-1 pr-3">{action.title}</span>
                      <span className="text-gray-500 text-xs">+{action.points}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}