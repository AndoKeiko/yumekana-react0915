import React from 'react'
import { useLocation } from 'react-router-dom'
import DOMPurify from 'dompurify'
import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children, isAuth, onLogout }) {
  const location = useLocation()
  const [leftSideText, setLeftSideText] = React.useState('')

  React.useEffect(() => {
    // 現在のルートに基づいてテキストを更新
    switch (location.pathname) {
      case '/':
        setLeftSideText(`
          <h2 class='h2'>目標を立てよう</h2>
          <p class="mb-3">目標設定には、「SMART」の原則が有効です。</p>
<p class="mb-3"><span class="font-bold block">Specific（具体的）：</span> 考えを言葉にすることでかなり具体化します。数行に完結に書いてみてください。</p>
<p class="mb-3"><span class="font-bold block">Measurable（測定可能）：</span> このアプリでは毎日の記録で目標達成度を測ります。</p>
<p class="mb-3"><span class="font-bold block">Achievable（達成可能）：</span> いつも同じモチベーションでなくていいです。リスケ機能で達成可能なスケジュールを組みなおします。</p>
<p class="mb-3"><span class="font-bold block">Relevant（関連性）：</span> 目標を達成した先には何があるのか。何のために目標を達成するのか</p>
<p class="mb-3"><span class="font-bold block">Time-bound（期限）：</span> 目標達成のための期限を設定します。これにより、毎日の努力の分量が具体化します。また現在地の確認も出来ます。</p>
        `)
        break
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
        `)
    }
  }, [location])

  return (
    <div className="flex h-screen">
      <div className="w-5/12 bg-gray-900 relative flex">
        <Sidebar isAuth={isAuth} onLogout={onLogout} />
        <div
          className="p-16 mt-16 text-white w-full text-left"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(leftSideText),
          }}
        />
      </div>
      <div className="w-7/12 overflow-y-auto">{children}</div>
    </div>
  )
}