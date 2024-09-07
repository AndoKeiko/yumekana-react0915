import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate,useNavigate, useLocation } from "react-router-dom";
import axios from 'axios';
import Goal from "./Goal";
import CreatePost from "./CreatePost";
import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";
import "../App.css";
import "react-day-picker/dist/style.css";
import TaskListPage from "./TaskListPage";
import GoalsListPage from "./GoalsListPage";
import TaskList from "./TaskList";
import Sidebar from "../components/Sidebar";
import DOMPurify from 'dompurify';
import type { Task } from "@/Types/index";
import { API_ENDPOINTS } from "@/config/api";

function AppContent() {
  const location = useLocation();
  const [leftSideText, setLeftSideText] = useState<string>("");
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [existingTasks, setExistingTasks] = useState<Task[]>([]);
  const [chatResponse, setChatResponse] = useState<Task[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // CSRF Cookieを最初に取得
    axios.get('/sanctum/csrf-cookie').then(() => {
      // CSRF Cookieを取得してからユーザー情報を取得
      axios.get(API_ENDPOINTS.USER, { withCredentials: true })
        .then(response => {
          if (response.data && typeof response.data === 'object') {
            console.log(response.data);
            setIsAuth(true);
          } else {
            console.error('予期しないレスポンス形式:', response.data);
            setIsAuth(false);
          }
        })
        .catch((error) => {
          console.error('ユーザー情報の取得に失敗しました:', error);
          setIsAuth(false);
        });
    }).catch((error) => {
      console.error('CSRFクッキーの取得に失敗しました:', error);
    });
  }, []);

      const onSaveTasks = async (tasks: Task[]): Promise<void> => {
        try {
          await axios.post('/save-tasks', { tasks });
          console.log("タスクが保存されました");
        } catch (error) {
          console.error("タスクの保存に失敗しました", error);
        }
      };

  const handleLogout = async () => {
    try {
      await axios.post('/logout');
      setIsAuth(false);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  useEffect(() => {
    // 現在のルートに基づいてテキストを更新
    switch (location.pathname) {
      case "/":
        setLeftSideText(`
          <h2 class='h2'>目標を立てよう</h2>
          <p class="mb-3">目標設定には、「SMART」の原則が有効です。</p>
<p class="mb-3"><span class="font-bold block">Specific（具体的）：</span> 考えを言葉にすることでかなり具体化します。数行に完結に書いてみてください。</p>
<p class="mb-3"><span class="font-bold block">Measurable（測定可能）：</span> このアプリでは毎日の記録で目標達成度を測ります。</p>
<p class="mb-3"><span class="font-bold block">Achievable（達成可能）：</span> いつも同じモチベーションでなくていいです。リスケ機能で達成可能なスケジュールを組みなおします。</p>
<p class="mb-3"><span class="font-bold block">Relevant（関連性）：</span> 目標を達成した先には何があるのか。何のために目標を達成するのか</p>
<p class="mb-3"><span class="font-bold block">Time-bound（期限）：</span> 目標達成のための期限を設定します。これにより、毎日の努力の分量が具体化します。また現在地の確認も出来ます。</p>
          `);
        break;
      // case "/goal":
      //   setLeftSideText("目標を設定し、達成に向けて進みましょう。");
      //   break;
      case "/tasks/:goalId":
        setLeftSideText("ここはタグも入りますか？");
        break;
      case "/TaskList":
        setLeftSideText("タスクを整理して、効率的に作業を進めましょう。");
        break;
      case "/CreatePost":
        setLeftSideText("今日の学びを記録しましょう。振り返りは大切です。");
        break;
      default:
        setLeftSideText(`
          <h2 class='h2'>あなたの夢をかなえるかもしれないアプリ</h2>
          <h3 class='h3'>夢の実現には目標設定とスケジュール管理が不可欠？！</h3>
          <p class="mb-3">夢を現実のものとするには、情熱と努力、そして具体的な目標設定と計画的なスケジュール管理が不可欠です。<br><br>心理学の研究では、目標を持つこと自体がモチベーションを高め、努力を継続させる上で極めて重要であることが示されています。目標を設定することで、夢が漠然とした憧れから具体的な達成可能な目標へと変わり、努力の方向性を明確にすることができます。</p>
          <p class="mb-3">目標設定には、「SMART」の原則が有効です。<br><br>
Specific（具体的）： 夢を達成した状態を具体的にイメージし、それを明確な言葉で表現します。<br>
Measurable（測定可能）： 目標達成度を測るための指標を設定します。<br>
Achievable（達成可能性）： 努力次第で達成可能な目標を設定します。<br>
Relevant（関連性）： あなたの価値観や人生の目標に関連した目標を設定します。<br>
Time-bound（期限）： 目標達成のための期限を設定します。</p>
<p>目標は言葉にするだけで、かなり具体化します。スケジューリングして進捗を見える化し、夢を現実のものにしましょう。</p>
          `);
    }
  }, [location]);

  // ProtectedRoute コンポーネントの定義
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuth) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <div className="flex h-screen">
      {/* 左側のサイドバー */}
      <div className="w-5/12 bg-gray-900 relative flex">
        {/* ハンバーガーメニュー */}
        {/* <button onClick={toggleMenu} className="absolute top-4 left-4 z-10">
          <IoMdMenu className="text-white text-4xl" />
        </button> */}

        {/* スライドインメニュー */}
        {/* <nav
          className={`nav absolute left-0 top-0 h-full w-full shadow-lg transform ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out`}
        > */}
      {/* サイドバーコンポーネント */}
      <Sidebar isAuth={isAuth} onLogout={handleLogout} />

        {/* 動的に変更されるテキスト */}
        <div
          className="p-12 mt-16 text-white w-full text-left"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(leftSideText),
          }}
        />
      </div>

      {/* 右側のスクロール可能なコンテンツ */}
      <div className="w-7/12 overflow-y-auto">
      <Routes>
            {/* 認証が必要なルート */}
          <Route path="/" element={<ProtectedRoute><Goal /></ProtectedRoute>} />
          <Route 
            path="/TaskList" 
            element={
              <ProtectedRoute>
                <TaskList 
                  tasks={tasks}
                  setTasks={setTasks}
                  onSaveTasks={onSaveTasks}
                  existingTasks={existingTasks}
                  chatResponse={chatResponse}
                />
              </ProtectedRoute>
            } 
          />
          <Route path="/goals" element={<ProtectedRoute><Goal /></ProtectedRoute>} />
          <Route path="/goallist" element={<ProtectedRoute><GoalsListPage /></ProtectedRoute>} />
          <Route path="/tasks/:goalId" element={<ProtectedRoute><TaskListPage /></ProtectedRoute>} />
          <Route path="/CreatePost" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
          {/* 認証が不要なルート */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  );
}

export default AppContent;
