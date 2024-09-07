import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/config/api";
import GoalsList from "./GoalList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router-dom';
import type { GoalItem } from "@/Types/index";



const GoalsListPage: React.FC = () => {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const user_id = localStorage.getItem("user_id");
  const navigate = useNavigate();

  const fetchGoals = useCallback(async () => {
    if (!user_id) {
      console.error("User ID not found");
      setServerError("ユーザーIDが見つかりません。ログインしてください");
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.get(
        API_ENDPOINTS.USER_GOALS(user_id ?? "")
      );
      setGoals(response.data as GoalItem[]);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
      setServerError("目標の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleGoalSelect = useCallback(async (goal: GoalItem) => {
    setSelectedGoal(goal);
    navigate(`/tasks/${goal.goalId}`);
  }, [navigate]);

  const handleGoalDelete = async (id: number) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_GOAL(id));
      setGoals(goals.filter((goal) => goal.goalId !== id));
      if (selectedGoal && selectedGoal.goalId === id) {
        setSelectedGoal(null);
      }
    } catch (error) {
      console.error("Failed to delete goal:", error);
      setServerError("目標の削除に失敗しました");
    }
  };

  return (
    <div>
      <h1>目標一覧</h1>
      {isLoading && <div>Loading...</div>}
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <GoalsList
        goals={goals}
        onGoalSelect={handleGoalSelect}
        onGoalDelete={handleGoalDelete}
        selectedGoal={selectedGoal}
        serverError={serverError}
      />
    </div>
  );
};

export default GoalsListPage;
