import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { FaTrashCan } from "react-icons/fa6";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_ENDPOINTS } from "@/config/api";
import { format, differenceInDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { GoalItem, GoalsListProps } from "@/Types";


const GoalsList: React.FC<GoalsListProps> = ({
  onGoalSelect,
  onGoalDelete,
  selectedGoal,
}) => {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const user_id = localStorage.getItem("user_id");

  const formatDateRange = (start: string, end: string) => {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const formattedStart = format(startDate, 'yyyy年M月d日', { locale: ja });
    const formattedEnd = format(endDate, 'yyyy年M月d日', { locale: ja });
    const duration = differenceInDays(endDate, startDate) + 1; // 終了日も含めるため+1

    return `${formattedStart}～${formattedEnd}（${duration}日間）`;
  };

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user_id) {
        setServerError("ユーザーIDが見つかりません。ログインしてください");
        setIsLoading(false);
        return;
      }
      try {
        // onGoalDelete(id);
        const response = await axios.get(
          API_ENDPOINTS.USER_GOALS(user_id ?? "")
        );
        setGoals(response.data as GoalItem[]);
        setServerError(null);
      } catch (error) {
        console.error("Failed to fetch goals:", error);
        setServerError("ユーザーの目標を取得できませんでした");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [user_id]);

  const handleDelete = async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await onGoalDelete(id);
      setGoals(prevGoals => prevGoals.filter(goal => goal.goalId !== id));
    } catch (error) {
      console.error("Failed to delete goal:", error);
      setServerError("目標の削除中にエラーが発生しました");
    }
  };
  if (isLoading) {
    return <div>読み込み中...</div>;
  }
  return (
    <section className="section">
      <h2 className="h2">目標一覧</h2>
      {serverError && (
        <Alert>
          <AlertDescription>
            {<p style={{ color: "red" }}> {serverError}</p>}
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
              key={goal.goalId}
              onClick={() => onGoalSelect(goal)}
              className={`flex items-center justify-between py-5 px-8 cursor-pointer ${
                selectedGoal?.goalId === goal.goalId
                  ? "bg-blue-100"
                  : "hover:bg-gray-100"
              }`}
            >
              <p className="text-left flex">{goal.goal}</p>
              <p className="text-left flex">
                期間: {formatDateRange(goal.targetPeriodStart, goal.targetPeriodEnd)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(goal.goalId, e)}
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

export default GoalsList;
