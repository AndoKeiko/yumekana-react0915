import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';
import { GoalItem, TaskItem } from '@/Types';

const GoalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [goal, setGoal] = useState<GoalItem | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoalDetails = async () => {
      try {
        const goalResponse: AxiosResponse<GoalItem> = await axios.get(`${API_ENDPOINTS.GOALS}/${id}`);
        setGoal(goalResponse.data);

        const tasksResponse: AxiosResponse<{ tasks: TaskItem[] }> = await axios.get(API_ENDPOINTS.GOAL_TASKS(Number(id)));
        setTasks(tasksResponse.data.tasks);
      } catch (error) {
        console.error("Failed to fetch goal details:", error);
        setServerError("目標の詳細を取得できませんでした");
      }
    };

    fetchGoalDetails();
  }, [id]);

  if (!goal) return <div>読み込み中...</div>;

  return (
    <div>
      <h2>{goal.name}</h2>
      <p>期間: {goal.period_start} - {goal.period_end}</p>
      <h3>タスク一覧</h3>
      {tasks.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>タスク名</th>
              <th>ステータス</th>
              <th>期限</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.taskName}</td>
                <td>{task.taskTime}</td>
                <td>{task.taskPriority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>タスクはありません。</p>
      )}
      {serverError && <p style={{ color: 'red' }}>{serverError}</p>}
    </div>
  );
};

export default GoalDetail;