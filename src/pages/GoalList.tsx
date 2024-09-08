import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { FaTrashCan } from "react-icons/fa6";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_ENDPOINTS } from "@/config/api";
import { format, differenceInDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { GoalItem, GoalsListProps, TaskItem } from "@/Types";

const GoalsList: React.FC<GoalsListProps> = ({
  user_id,
  goals: initialGoals,
  onGoalDelete,
  selectedGoal,
}) => {
  const [goals, setGoals] = useState<GoalItem[]>(initialGoals);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<GoalItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const formatDateRange = useCallback((start: string, end: string) => {
    if (!start || !end) return "日付が不明です";
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const formattedStart = format(startDate, 'yyyy年M月d日', { locale: ja });
    const formattedEnd = format(endDate, 'yyyy年M月d日', { locale: ja });
    const duration = differenceInDays(endDate, startDate) + 1;
    return `${formattedStart}～${formattedEnd}（${duration}日間）`;
  }, []);

  const fetchTasks = useCallback(async (goalId: number) => {
    try {
      const response = await axios.get(API_ENDPOINTS.GOAL_TASKS(goalId));
      const fetchedTasks = response.data.tasks;
      if (Array.isArray(fetchedTasks)) {
        setTasks(fetchedTasks);
      } else {
        console.error("Fetched tasks is not an array:", response.data);
        setTasks([]);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setServerError("タスクの取得中にエラーが発生しました");
      setTasks([]);
    }
  }, []);

  const handleGoalSelect = useCallback(async (goal: GoalItem) => {
    setSelectedGoalDetails(goal);
    setTasks([]); // タスクをリセット
    await fetchTasks(goal.id);
  }, [fetchTasks]);


  // const handleGoalSelect = useCallback(async (goal: GoalItem) => {
  //   setSelectedGoalDetails(goal);
  //   setTasks([]); // タスクをリセット
  //   await fetchTasks(goal.id);
  // }, [fetchTasks]);

  const handleDelete = useCallback(async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await onGoalDelete(id);
      setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id));
    } catch (error) {
      console.error("Failed to delete goal:", error);
      setServerError("目標の削除中にエラーが発生しました");
    }
  }, [onGoalDelete]);

  const fetchGoals = useCallback(async () => {
    if (!user_id) {
      setServerError("ユーザーIDが見つかりません。ログインしてください");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(API_ENDPOINTS.USER_GOALS(user_id));
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

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <section className="section">
      <h2 className="h2">目標一覧</h2>
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
              onClick={() => handleGoalSelect(goal)}
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
                onClick={(e) => handleDelete(goal.id, e)}
                className="ml-4"
              >
                <FaTrashCan className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {selectedGoalDetails && (
        <div className="edit-section">
          <h3>目標の編集: {selectedGoalDetails.name}</h3>
          <h4>タスク一覧</h4>
          {tasks.length > 0 ? (
            <ul>
              {tasks.map((task) => (
                <li key={task.id}>{task.name}</li>
              ))}
            </ul>
          ) : (
            <p>タスクはありません。</p>
          )}
        </div>
      )}
    </section>
  );
};

export default GoalsList;