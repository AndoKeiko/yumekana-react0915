import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/config/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FaTrashCan } from "react-icons/fa6";
import { format, differenceInDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { GoalItem } from "@/Types/index";

interface GoalsListPageProps {
  user_id: string;
  initialGoals?: GoalItem[];
  onGoalDelete: (id: number) => Promise<void>;
}

const GoalsListPage: React.FC<GoalsListPageProps> = ({
  user_id,
  initialGoals = [],
  onGoalDelete,
}) => {
  const [goals, setGoals] = useState<GoalItem[]>(initialGoals);
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const formatDateRange = useCallback((start: string, end: string) => {
    if (!start || !end) return "日付が不明です";
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const formattedStart = format(startDate, 'yyyy年M月d日', { locale: ja });
    const formattedEnd = format(endDate, 'yyyy年M月d日', { locale: ja });
    const duration = differenceInDays(endDate, startDate) + 1;
    return `${formattedStart}～${formattedEnd}（${duration}日間）`;
  }, []);

  const fetchGoals = useCallback(async () => {
    if (!user_id) {
      setServerError("ユーザーIDが見つかりません。ログインしてください");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get<GoalItem[]>(API_ENDPOINTS.USER_GOALS(user_id));
      setGoals(response.data);
      setServerError(null);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
      setServerError("ユーザーの目標を取得できませんでした");
    } finally {
      setIsLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleGoalSelect = useCallback((goal: GoalItem) => {
    setSelectedGoal(goal);
    navigate(`/tasks/${goal.id}`);
  }, [navigate]);

  const handleGoalDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await onGoalDelete(id);
      setGoals(goals.filter((goal) => goal.id !== id));
      if (selectedGoal && selectedGoal.id === id) {
        setSelectedGoal(null);
      }
    } catch (error) {
      console.error("Failed to delete goal:", error);
      setServerError("目標の削除に失敗しました");
    }
  };

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <section className="section">
      <h2 className="h2">目標一覧GoalListPage</h2>
      {serverError && (
        <Alert>
          <AlertDescription>
            <p style={{ color: "red" }}>{serverError}</p>
          </AlertDescription>
        </Alert>
      )}
      {goals.length === 0 ? (
        <Alert>
          <AlertDescription>目標がまだ設定されていません。</AlertDescription>
        </Alert>
      ) : (
        <ul>
          {goals.map((goal) => (
            <li
              key={goal.id}
              onClick={() => {
                console.log("Clicked goal:あああ", goal);
                handleGoalSelect(goal);
              }}
              className={`flex items-center justify-between py-5 px-8 cursor-pointer ${
                selectedGoal?.id === goal.id ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
            >
              <p className="text-left flex">{goal.name}</p>
              <p className="text-left flex">
                期間: {formatDateRange(goal.period_start, goal.period_end)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleGoalDelete(goal.id, e)}
                className="ml-4"
              >
                <FaTrashCan className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default GoalsListPage;