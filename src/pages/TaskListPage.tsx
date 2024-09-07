import React, {useState, useEffect, useCallback} from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS } from "@/config/api";
import TaskList from './TaskList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Task } from "@/Types/index";

const TaskListPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { goalId } = useParams<{ goalId: string }>();

  const fetchTasks = useCallback(async () => {
    if (!goalId) {
      console.error("Goal ID not found");
      setServerError("目標IDが見つかりません。");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(API_ENDPOINTS.GOAL_TASKS(parseInt(goalId)));
      setTasks(response.data.tasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setServerError("タスクの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const saveTasks = async (tasksToSave: Task[]) => {
    if (!goalId) {
      setServerError("目標IDが見つかりません。");
      return;
    }
    try {
      await axios.post(API_ENDPOINTS.SAVE_TASKS(parseInt(goalId)), {
        tasks: tasksToSave,
        user_id: localStorage.getItem("user_id"),
      });
      setTasks(tasksToSave);
    } catch (error) {
      console.error("Failed to save tasks:", error);
      setServerError("タスクの保存に失敗しました");
    }

    if (isLoading) {
      return <div>Loading...</div>;
    }   
  };

  return (
    <div className='m-4'>
    <h1 className='h1'>タスクリスト</h1>
    {serverError && (
      <Alert variant="destructive">
        <AlertDescription>{serverError}</AlertDescription>
      </Alert>
    )}
    {!serverError && (
      <TaskList tasks={tasks} setTasks={setTasks} onSaveTasks={saveTasks} />
    )}
  </div>
  )
};

export default TaskListPage;