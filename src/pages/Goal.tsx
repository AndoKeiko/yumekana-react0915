import React, { useState, useCallback, useEffect } from "react";
import { useUser } from '../hooks/useUser';
import { useForm } from "react-hook-form";
import axios from 'axios';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "@/config/api";
import ScheduleComponent from './ScheduleComponent';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import moment from 'moment';
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface Task {
  id: string | number;
  name: string;
  taskName?: string;
  taskTime?: number;
  estimated_time?: number;
  taskPriority?: number;
  priority?: number;
  order?: number;
  userId?: number;
  goalId?: number;
  description?: string;
  elapsedTime?: number;
  reviewInterval?: number;
  repetitionCount?: number;
  lastNotificationSent?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface Goal {
  id: number;
  name: string;
  currentStatus: string;
  periodStart: string;
  periodEnd: string;
  description: string;
  status: number;
  totalTime: number;
  progressPercentage: number;
}

interface ScheduleConfig {
  hoursPerDay: number;
  startTime: string;
  startDate: string;
}

interface Event {
  title: string;
  start: Date;
  end: Date;
}

interface GoalProps {
  goalId?: number;
}

const CombinedGoalComponent: React.FC<GoalProps> = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [response, setResponse] = useState<string>("");
  const [chatResponse, setChatResponse] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { userId, setUserIdAction } = useUser();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const { reset } = useForm();
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    hoursPerDay: 8,
    startTime: "09:00",
    startDate: new Date().toISOString().split('T')[0]
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<Goal>({
    mode: "onChange",
    defaultValues: {
      name: "",
      currentStatus: "",
      periodStart: "",
      periodEnd: "",
      description: "",
      status: 0,
      totalTime: 0,
      progressPercentage: 0,
    },
  });

  const status = watch("status");
  const totalTime = watch("totalTime");

  const onGoalDelete = useCallback(async (id: number) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_GOAL(id));
      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== id));
      if (selectedGoal && selectedGoal.id === id) {
        setSelectedGoal(null);
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
      setServerError("目標の削除に失敗しました");
    }
  }, [selectedGoal]);

  const handleGoalDelete = useCallback(async (id: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await onGoalDelete(id);
    } catch (error) {
      console.error("Failed to delete goal:", error);
      setServerError("目標の削除に失敗しました");
    }
  }, [onGoalDelete]);

  const handleExportToSchedule = () => {
    setShowSchedule(true);
  };

  const handleCloseSchedule = () => {
    setShowSchedule(false);
  };

  const calculateProgressPercentage = useCallback(() => {
    if (totalTime > 0) {
      const progress = (status / totalTime) * 100;
      return Math.min(100, Math.max(0, Math.round(progress)));
    }
    return 0;
  }, [status, totalTime]);

  useEffect(() => {
    const progressPercentage = calculateProgressPercentage();
    setValue("progressPercentage", progressPercentage);
  }, [calculateProgressPercentage, setValue]);

  const generateSchedule = (tasks: Task[], config: ScheduleConfig) => {
    let currentDate = moment(config.startDate).startOf('day');
    const schedule: Event[] = [];

    tasks.forEach(task => {
      let remainingHours = parseFloat(task.estimated_time?.toString() || task.taskTime?.toString() || "0");
      while (remainingHours > 0) {
        const hoursToday = Math.min(remainingHours, config.hoursPerDay);
        const startTime = moment(`${currentDate.format('YYYY-MM-DD')} ${config.startTime}`, 'YYYY-MM-DD HH:mm');
        const endTime = moment(startTime).add(hoursToday, 'hours');

        schedule.push({
          title: task.name || task.taskName || "",
          start: startTime.toDate(),
          end: endTime.toDate(),
        });

        remainingHours -= hoursToday;
        currentDate = currentDate.add(1, 'day');
      }
    });

    return schedule;
  };

  const handleReflectSchedule = () => {
    const generatedSchedule = generateSchedule(tasks, scheduleConfig);
    setEvents(generatedSchedule);
    setShowSchedule(true);
  };

  const fetchUserData = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
      if (response.data && response.data.id) {
        const newUserId = response.data.id.toString();
        setUserIdAction(newUserId);
      } else {
        throw new Error('User data not found in the response');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setErrorMessage('ユーザー情報の取得に失敗しました。再度ログインしてください。');
    }
  }, [setUserIdAction]);

  const fetchGoals = useCallback(async () => {
    if (!userId) {
      setServerError("ユーザーIDが見つかりません。ログインしてください。");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(API_ENDPOINTS.USER_GOALS(userId));
      setGoals(response.data as Goal[]);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
      setServerError("ユーザーの目標を取得できませんでした");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (userId) {
      fetchGoals();
    }
  }, [userId, fetchGoals]);

  const handleSave = async (goalId: number, taskId: string | number) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) {
      console.error("Task not found");
      return;
    }
  
    try {
      const response = await axios.put<Task>(API_ENDPOINTS.UPDATE_TASK(goalId, Number(taskId)), taskToUpdate);
      const savedTask: Task = response.data;
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === Number(taskId) ? { ...task, ...savedTask } : task
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update task:", error);
      setServerError("タスクの更新に失敗しました");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: keyof Task, taskId: string | number) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const handleDeleteTask = async (goalId: number, taskId: string | number) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_TASK(goalId, Number(taskId)));
      setTasks(tasks.filter(task => task.id !== Number(taskId)));
    } catch (error) {
      console.error("Failed to delete task:", error);
      setServerError("タスクの削除に失敗しました");
    }
  };

  const handleEditClick = (taskId: string | number) => {
    setEditingId(taskId.toString());
  };

  const handleUpdateElapsedTime = async (goalId: number, taskId: number, elapsedTime: number) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_ELAPSED_TIME(goalId, taskId), { elapsed_time: elapsedTime });
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, elapsedTime: response.data.task.elapsed_time } : task
      ));
    } catch (error) {
      console.error("Failed to update elapsed time:", error);
      setServerError("経過時間の更新に失敗しました");
    }
  };

  const handleUpdateReviewInterval = async (goalId: number, taskId: number, reviewInterval: string) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_REVIEW_INTERVAL(goalId, taskId), { review_interval: reviewInterval });
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, reviewInterval: response.data.task.review_interval } : task
      ));
    } catch (error) {
      console.error("Failed to update review interval:", error);
      setServerError("レビュー間隔の更新に失敗しました");
    }
  };

  const handleUpdateTaskOrder = async (goalId: number, updatedTasks: Task[]) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_TASK_ORDER(goalId), {
        tasks: updatedTasks.map((task, index) => ({ id: task.id, order: index + 1 }))
      });
      setTasks(response.data.tasks);
    } catch (error) {
      console.error("Failed to update task order:", error);
      setServerError("タスクの順序更新に失敗しました");
    }
  };

  useEffect(() => {
    const calculatedProgress = totalTime > 0 ? (status / totalTime) * 100 : 0;
    const roundedProgress = Math.min(100, Math.max(0, Math.round(calculatedProgress)));
    setValue("progressPercentage", roundedProgress);
  }, [totalTime, status, setValue]);

  useEffect(() => {
    if (chatResponse.length > 0) {
      const transformedTasks = chatResponse.map((task, index) => ({
        id: index + 1,
        name: String(task.taskName ?? ""),
        taskTime: task.taskTime ?? 0,
        taskPriority: task.taskPriority,
        order: index + 1,
        userId: task.userId,
        goalId: task.goalId,
        description: task.description,
        elapsedTime: task.elapsedTime,
        reviewInterval: task.reviewInterval || 0,
        repetitionCount: task.repetitionCount || 0,
        lastNotificationSent: task.lastNotificationSent || null,
        createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : new Date().toISOString(),
      }));
      setTasks(transformedTasks);
    }
  }, [chatResponse]);

  const onSubmit = async (data: Goal) => {
    if (!userId) {
      setServerError("ユーザーIDが見つかりません。ログインしてください。");
      return;
    }

    const submissionData = {
      name: data.name,
      user_id: Number(userId),
      current_status: data.currentStatus,
      period_start: data.periodStart,
      period_end: data.periodEnd,
      description: data.description,
      status: data.status || 0,
      total_time: data.totalTime || 0,
      progress_percentage: data.progressPercentage || 0,
    };

    try {
      setIsLoading(true);
      setServerError(null);
      const result = await axios.post<{ message: string; Goals: { id: number } }>(
        API_ENDPOINTS.CREATE_GOAL,
        submissionData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      setResponse(result.data.message);

      const goalId = result.data.Goals.id;
      if (!goalId) {
        throw new Error("goalId is undefined");
      }
      await axios.get(API_ENDPOINTS.CSRF_COOKIE, { withCredentials: true });

      const chatResult: any = await axios.post(
        API_ENDPOINTS.CHAT_GOAL(goalId),
        {
          message: "ユーザーからのメッセージ",
          userId: userId,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let parsedChatResponse;
      try {
        const cleanedResponse = chatResult.data.response
          .replace(/```json|```/g, "")
          .trim();
        parsedChatResponse = JSON.parse(cleanedResponse);

        const newTotalTime = parsedChatResponse.reduce((sum: number, task: Task) => sum + (task.taskTime ?? 0), 0);
        setValue("totalTime", newTotalTime);

      } catch (error) {
        console.error("エラー:", error);
      } finally {
        setIsLoading(false);
      }

      setChatResponse(parsedChatResponse);
      await fetchGoals();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setServerError(`エラー: ${error.response?.data.message || '不明なエラー'}`);
      } else {
        setServerError("未知のエラーが発生しました");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateDate = (value: string) => {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today || "開始日は今日以降の日付を選択してください";
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 

 0, 0, 0);

    if (selectedDate < today) {
      setValue(
        name as "periodStart" | "periodEnd",
        today.toISOString().split("T")[0]
      );
    }
  };

  const handleGoalSelect = useCallback(
    async (goal: Goal) => {
      setSelectedGoal(goal);
      reset({
        ...goal,
        periodStart: formatDate(goal.periodStart),
        periodEnd: formatDate(goal.periodEnd),
      });

      try {
        const response = await axios.get<{ tasks: Task[] }>(API_ENDPOINTS.GOAL_TASKS(goal.id));
        setTasks(response.data.tasks);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setServerError("タスクの取得に失敗しました");
      }
    },
    [reset]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  return (
    <>
      <section className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">目標設定</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="my-5">
            <Label htmlFor="name" className="w-full block text-left">
              目標名
            </Label>
            <Input
              id="name"
              className="my-2"
              {...register("name", { required: "目標名は必須です" })}
            />
            {errors.name && (
              <p className="text-red-600 text-left">{errors.name.message}</p>
            )}
          </div>
          <div className="my-5">
            <Label htmlFor="currentStatus" className="w-full block text-left">
              現在の状況
            </Label>
            <Input
              id="currentStatus"
              className="my-2"
              {...register("currentStatus", { required: "現在の状況は必須です" })}
            />
            {errors.currentStatus && (
              <p className="text-red-600 text-left">{errors.currentStatus.message}</p>
            )}
          </div>
          <div className="my-5">
            <Label htmlFor="periodStart" className="w-full block text-left">
              目標期間（開始日）
            </Label>
            <Input
              id="periodStart"
              className="my-2"
              type="date"
              {...register("periodStart", {
                required: "目標期間の開始日は必須です",
                validate: validateDate,
              })}
              onChange={handleDateChange}
            />
            {errors.periodStart && (
              <p className="text-red-600 text-left">{errors.periodStart.message}</p>
            )}
          </div>
          <div className="my-5">
            <Label htmlFor="periodEnd" className="w-full block text-left">
              目標期間（修了日）
            </Label>
            <Input
              id="periodEnd"
              className="my-2"
              type="date"
              {...register("periodEnd", {
                required: "目標期間の終了日は必須です",
                validate: validateDate,
              })}
              onChange={handleDateChange}
            />
            {errors.periodEnd && (
              <p className="text-red-600 text-left">{errors.periodEnd.message}</p>
            )}
          </div>
          <div className="my-5">
            <Label htmlFor="description" className="w-full block text-left">
              詳細
            </Label>
            <Textarea id="description" {...register("description")} />
          </div>
          <div className="my-5">
            <Button type="submit" className="button" disabled={isLoading}>
              {isLoading ? "送信中..." : "目標を設定"}
            </Button>
          </div>
        </form>

        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        {isLoading && <div className="loading">処理中...</div>}
        {response && (
          <div className="mt-4">
            <p className="text-green-600">{response}</p>
          </div>
        )}
        {tasks.length > 0 ? (
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="border px-4 py-2">順序</th>
                  <th className="border px-4 py-2">タスク名</th>
                  <th className="border px-4 py-2">所要時間</th>
                  <th className="border px-4 py-2">優先度</th>
                  <th className="border px-4 py-2">アクション</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => (
                  <tr key={task.id}>
                    <td className="border px-4 py-2">
                      {task.order != null ? task.order.toString() : (index + 1).toString()}
                    </td>
                    <td className="border px-4 py-2">
                      {editingId === task.id.toString() ? (
                        <Input
                          value={task.name || task.taskName || ''}
                          onChange={(e) => handleChange(e, "name", task.id)}
                        />
                      ) : (
                        task.name || task.taskName
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      {editingId === task.id.toString() ? (
                        <Input
                          value={(task.taskTime || task.estimated_time || '').toString()}
                          onChange={(e) => handleChange(e, "taskTime", task.id)}
                          type="number"
                        />
                      ) : (
                        task.taskTime || task.estimated_time
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      {editingId === task.id.toString() ? (
                        <select
                          value={String(task.taskPriority || task.priority || 1)}
                          onChange={(e) => handleChange(e, "taskPriority", task.id)}
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="1">低</option>
                          <option value="2">中</option>
                          <option value="3">高</option>
                        </select>
                      ) : (task.taskPriority === 1 || task.priority === 1) ? (
                        "低"
                      ) : (task.taskPriority === 2 || task.priority === 2) ? (
                        "中"
                      ) : (
                        "高"
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      {editingId === task.id.toString() ? (
                        <Button onClick={() => handleSave(task.id)}>保存</Button>
                      ) : (
                        <div className="flex space-x-2">
                          <Button onClick={() => handleEditClick(task.id)}>編集</Button>
                          <Button onClick={() => handleDeleteTask(task.id)}>削除</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SortableContext>
        ) : (
          <p>タスクがありません。または読み込み中です。</p>
        )}
        {tasks.length > 0 && (
          <Button onClick={handleReflectSchedule} className="mt-4">スケジュールに書き出す</Button>
        )}
      </section>
      <div className="mb-20">
        <Link to="/goallist">
          <Button>目標一覧を見る</Button>
        </Link>
      </div>
      {showSchedule && (
        <div className="schedule-modal">
          <Button onClick={handleCloseSchedule} className="schedule_close">閉じる</Button>
          <ScheduleComponent
            events={events}
            hoursPerDay={scheduleConfig.hoursPerDay}
            startTime={scheduleConfig.startTime}
            tasks={tasks}
          />
        </div>
      )}
    </>
  );
};

export default CombinedGoalComponent;