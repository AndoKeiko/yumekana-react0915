import React, { useState, useCallback, useEffect } from "react";
import { useUser } from '../hooks/useUser';
import { useForm } from "react-hook-form";
import axios from 'axios';
import "../App.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "@/config/api";
import type { Task, Goal } from "@/Types/index";
import SortableItem from './SortableItem';
import ScheduleComponent from './ScheduleComponent';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  reset,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface UserResponse {
  users: { id: number }[];
}

interface GoalProps {
  goalId?: number;
}

const Goal: React.FC<GoalProps> = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [response, setResponse] = useState<string>("");
  const [chatResponse, setChatResponse] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const { userId, setUserIdAction } = useUser();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const { reset } = useForm();
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [startTime, setStartTime] = useState<string>("09:00");

  const setTasksCallback = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
  }, []);

  const setServerErrorCallback = useCallback((error: string | null) => {
    setServerError(error);
  }, []);

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
    console.log("onGoalDelete called with id:", id); // デバッグログ
    try {
      console.log("Sending delete request to:", API_ENDPOINTS.DELETE_GOAL(id)); // デバッグログ
      await axios.delete(API_ENDPOINTS.DELETE_GOAL(id));
      console.log('Goal deleted successfully');
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
    console.log("handleGoalDelete called with id:", id); // デバッグログ
    try {
      await onGoalDelete(id);
      console.log("onGoalDelete completed successfully"); // デバッグログ
    } catch (error) {
      console.error("Failed to delete goal:", error);
      setServerError("目標の削除に失敗しました");
    }
  }, [onGoalDelete]);

  const handleExportToSchedule = () => {
    console.log("スケジュールに書き出す");
    console.log("Tasks:", tasks);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchUserData = useCallback(async () => {
    try {
      const response = await axios.get<UserResponse>(API_ENDPOINTS.USER, { withCredentials: true });
      console.log('User data response:', response.data);

      if (response.data && response.data.users && response.data.users[0] && response.data.users[0].id) {
        const newUserId = response.data.users[0].id.toString();
        setUserIdAction(newUserId);
        console.log('Set user ID:', newUserId);
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
      console.error("User ID not found");
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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index + 1
        }));
      });
    }
  };

  // const handleSave = async (id: string | number) => {
  //   if (!editedTask) return;

  //   try {
  //     const response = await axios.put<Task>(API_ENDPOINTS.UPDATE_TASK(Number(id)), editedTask);
  //     const updatedTask: Task = response.data;
  //     setTasks(prevTasks => prevTasks.map(task =>
  //       task.id === Number(id) ? { ...task, ...updatedTask } : task
  //     ));
  //     setEditingId(null);
  //     setEditedTask(null);
  //   } catch (error) {
  //     console.error("Failed to update task:", error);
  //     setServerError("タスクの更新に失敗しました");
  //   }
  // };
  const handleSave = async (taskId: number, updatedTask: Task) => {
    try {
      const response = await axios.put<Task>(API_ENDPOINTS.UPDATE_TASK(taskId), updatedTask);
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, ...response.data } : task
      ));
    } catch (error) {
      console.error("タスクの更新に失敗しました:", error);
      setServerError("タスクの更新に失敗しました");
    }
  };

  // const handleChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  //   field: string
  // ) => {
  //   if (editedTask) {
  //     setEditedTask({
  //       ...editedTask,
  //       [field]: field === "taskTime" || field === "taskPriority" ? Number(e.target.value) : e.target.value
  //     });
  //   }
  // };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof Task,
    taskId: number
  ) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, [field]: e.target.value } : task
    ));
  };

  const handleDeleteTask = async (id: string | number) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_TASK(Number(id)));
      setTasks(tasks.filter(task => task.id !== Number(id)));
    } catch (error) {
      console.error("Failed to delete task:", error);
      setServerError("タスクの削除に失敗しました");
    }
  };

  const handleEditClick = (taskId: string) => {
    console.log(`Editing task with id: ${taskId}`);
  };

  useEffect(() => {
    const calculatedProgress = totalTime > 0 ? (status / totalTime) * 100 : 0;
    const roundedProgress = Math.min(100, Math.max(0, Math.round(calculatedProgress)));
    setValue("progressPercentage", roundedProgress);
    console.log("Calculated progress:", roundedProgress);
  }, [totalTime, status, setValue]);

  console.log("chatResponse updated:", chatResponse);

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

  useEffect(() => {
    if (chatResponse.length > 0 && tasks.length === 0) {
      setTasks(chatResponse);
    }
  }, [chatResponse, tasks]);

  useEffect(() => {
    console.log("tasks updated:あああ", tasks);
  }, [tasks]);

  const onSubmit = async (data: Goal) => {
    console.log("onSubmit関数が呼び出されました", data);
    console.log("Current userId:", userId);
    if (!userId) {
      setServerError("ユーザーIDが見つかりません。ログインしてください。");
      return;
    }

    console.log("onSubmit関数が呼び出されました");
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

    console.log("送信データ:", JSON.stringify(submissionData, null, 2));

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
      console.log("サーバーレスポンス:", result.data);
      setResponse(result.data.message);

      const goalId = result.data.Goals.id;
      if (!goalId) {
        throw new Error("goalId is undefined");
      }
      await axios.get('/sanctum/csrf-cookie');

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
      console.log("Sending chat request:", API_ENDPOINTS.CHAT_GOAL(goalId));

      let parsedChatResponse;
      try {
        const cleanedResponse = chatResult.data.response
          .replace(/```json|```/g, "")
          .trim();
        parsedChatResponse = JSON.parse(cleanedResponse);

        const newTotalTime = parsedChatResponse.reduce((sum: number, task: Task) => sum + (task.taskTime ?? 0), 0);
        setValue("totalTime", newTotalTime);

      } catch (error) {
        handleError(error);
        console.error("エラー:", error);
        if (typeof error === 'object' && error !== null && 'response' in error) {
          const axiosError = error as { response?: { data?: unknown }, config?: { data?: unknown } };
          console.log("サーバーレスポンス:", axiosError.response?.data);
          console.log("リクエストデータ:", axiosError.config?.data);
        }
      } finally {
        setIsLoading(false);
      }

      setChatResponse(parsedChatResponse);
      console.log("chatResponse:", chatResponse);
      await fetchGoals();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("Axios エラーレスポンス:", error.response.data);
        setServerError(`エラー: ${error.response.data.message || '不明なエラー'}`);
      } else {
        console.error("Axios以外のエラー:", error);
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
    today.setHours(0, 0, 0, 0);

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
        setTasksCallback(response.data.tasks);
        console.log("Submitted goalId:", response);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setServerErrorCallback("タスクの取得に失敗しました");
      }
    },
    [reset, setTasksCallback, setServerErrorCallback]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };
  const handleEdit = (taskId: number, updatedTask: Partial<Task>) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, ...updatedTask } : task
    ));
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
            <Label
              htmlFor="currentStatus"
              className="w-full block text-left"
            >
              現在の状況
            </Label>
            <Input
              id="currentStatus"
              className="my-2"
              {...register("currentStatus", {
                required: "現在の状況は必須です",
              })}
            />
            {errors.currentStatus && (
              <p className="text-red-600 text-left">
                {errors.currentStatus.message as React.ReactNode}
              </p>
            )}
          </div>
          <div className="my-5">
            <Label
              htmlFor="periodStart"
              className="textleft w-full block text-left"
            >
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
              <p className="text-red-600 text-left">
                {errors.periodStart.message}
              </p>
            )}
          </div>
          <div className="my-5">
            <Label
              htmlFor="periodEnd"
              className="textleft w-full block text-left"
            >
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
              <p className="text-red-600 text-left">
                {errors.periodEnd.message}
              </p>
            )}
          </div>
          <div className="my-5">
            <Label htmlFor="description" className="w-full block text-left">
              詳細
            </Label>
            <Textarea
              id="description"
              {...register("description")}
            />
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
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
                    <SortableItem
                    key={task.id}
                    id={task.id}
                    task={task}
                    index={index}
                    handleEditClick={() => handleEditClick(task.id)}
                    handleDeleteTask={() => handleDeleteTask(task.id)}
                    handleEdit={(updatedTask) => handleEdit(task.id, updatedTask)}
                    handleSave={() => handleSave(task.id)}
                    handleChange={(e, field) => handleChange(e, field, task.id)}
                    />
                    // <SortableItem
                    //   key={task.id}
                    //   id={task.id}
                    //   task={task}
                    //   index={index}
                    //   handleEditClick={handleEditClick}
                    //   handleDeleteTask={handleDeleteTask}
                    //   handleEdit={handleEdit}
                    //   handleSave={handleSave}
                    //   handleChange={handleChange}
                    // />
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        ) : (
          <p>タスクがありません。または読み込み中です。</p>
        )}
        {tasks.length > 0 && (
          <Button onClick={handleExportToSchedule} className="mt-4">スケジュールに書き出す</Button>
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
          <ScheduleComponent tasks={tasks} hoursPerDay={hoursPerDay} startTime={startTime} />
          {console.log("Tasks passed to ScheduleComponent:", tasks)}
        </div>
      )}
    </>
  );
};

export default Goal;