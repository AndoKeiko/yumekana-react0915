
// import React, { useState } from 'react';
// import SimpleSortableItem from "./SimpleSortableItem";
// import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import type { Task } from '@/Types/index';

// const Goal: React.FC = () => {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [taskName, setTaskName] = useState<string>('');

//   const handleAddTask = () => {
//     const newTask: Task = {
//       id: tasks.length + 1,
//       name: taskName,
//       taskTime: 0,
//       taskPriority: 0,
//       order: tasks.length + 1,
//       userId: 1,
//       goalId: 1,
//       description: '',
//       elapsedTime: 0,
//       reviewInterval: 0,
//       repetitionCount: 0,
//       lastNotificationSent: null,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };
//     setTasks([...tasks, newTask]);
//     setTaskName('');
//   };

//   return (
//     <section className="section">
//       <h1 className="h1">近い未来の目標</h1>
//       <form onSubmit={handleAddTask}>

//       <div className="my-5">
//         <Label htmlFor="taskName" className="w-full block text-left">タスク名</Label>
//         <Input
//           id="taskName"
//           value={taskName}
//           onChange={(e) => setTaskName(e.target.value)}
//         />
//         <Button onClick={handleAddTask} className="mt-2">タスクを追加</Button>
//       </div>
//       </form>
//       {tasks.length > 0 ? (
//         <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
//           <table className="min-w-full bg-white">
//             <thead>
//               <tr>
//                 <th className="border px-4 py-2">順序</th>
//                 <th className="border px-4 py-2">タスク名</th>
//                 <th className="border px-4 py-2">所要時間</th>
//                 <th className="border px-4 py-2">優先度</th>
//                 <th className="border px-4 py-2">アクション</th>
//               </tr>
//             </thead>
//             <tbody>
//               {tasks.map((task, index) => (
//                 <SimpleSortableItem
//                   key={task.id || index}
//                   id={task.id}
//                   task={task}
//                   index={index}
//                 />
//               ))}
//             </tbody>
//           </table>
//         </SortableContext>
//       ) : (
//         <p>タスクがありません。または読み込み中です。</p>
//       )}
//     </section>
//   );
// };

// export default Goal;



import React, { useState, useCallback, useEffect } from "react";
import { useUser } from '../hooks/useUser';
import { useForm } from "react-hook-form";
import axios, { AxiosError } from "axios";
import "../App.css";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "@/config/api";
import type { Task, Goal } from "@/Types/index";


import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
// import SortableItem from "./SortableItem";

import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
// import SimpleSortableItem from "./SimpleSortableItem";
import SortableItem from "./SortableItem";
const localizer = momentLocalizer(moment);

interface UserResponse {
  users: { id: number }[];
}

// GoalPropsの定義
interface GoalProps {
  goalId?: number;
}


//Goalコンポーネント
const Goal: React.FC<GoalProps> = () => {
  //状態変数の定義
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
  const [calculatedTotalTime, setCalculatedTotalTime] = useState<number>(0);
  const [calculatedProgressPercentage, setCalculatedProgressPercentage] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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

  // 期間の開始日と終了日を監視
  const status = watch("status");
  const totalTime = watch("totalTime");

  // 進捗状況を計算する関数
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


  /**
   * ログインユーザーの全ての目標を取得する関数
   * @returns {Promise<void>}
   */
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
      setChatResponse((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index + 1  // taskOrder を order に変更
        }));
      });
    }
  };

  const handleSave = async (id: string | number) => {
    if (!editedTask) return;

    try {
        const response = await axios.put<Task>(API_ENDPOINTS.UPDATE_TASK(Number(id)), editedTask);
        const updatedTask: Task = response.data;
        setTasks(prevTasks => prevTasks.map(task =>
            task.id === Number(id) ? { ...task, ...updatedTask } : task
        ));
        setEditingId(null);
        setEditedTask(null);
    } catch (error) {
        console.error("Failed to update task:", error);
        setServerError("タスクの更新に失敗しました");
    }
};

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } },
  field: string
) => {
  if (editedTask) {
    setEditedTask({
      ...editedTask,
      [field]: field === "taskTime" || field === "tasktaskPriority" ? Number(e.target.value) : e.target.value
    });
  }
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

  // progressPercentageを計算
  useEffect(() => {
    const calculatedProgress = totalTime > 0 ? (status / totalTime) * 100 : 0;
    const roundedProgress = Math.min(100, Math.max(0, Math.round(calculatedProgress)));
    setValue("progressPercentage", roundedProgress);
    console.log("Calculated progress:", roundedProgress); // デバッグ用
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
    console.log("tasks updated:", tasks);
  }, [tasks]);
  
  useEffect(() => {
    if (chatResponse.length > 0 && tasks.length === 0) {
      setTasks(chatResponse);
    }
  }, [chatResponse, tasks]);

  /**
   * 新しい目標を作成し、AIを使用して関連タスクを生成する
   * @param {Goal} data - フォームから送信された目標データ
   * @returns {Promise<void>}
   */
  //onSubmit関数の定義
  const onSubmit = async (data: Goal) => {
    console.log("onSubmit関数が呼び出されました", data);
    console.log("Current userId:", userId);
    if (!userId) {
      setServerError("ユーザーIDが見つかりません。ログインしてください。");
      return;
    }
  
    // if (data.totalTime === 0) {
    //   setServerError("総予定時間は必須です");
    //   return;
    // }

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
      const result = await axios.post(
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
  
        const newTotalTime = parsedChatResponse.reduce((sum: number, task: Task) => sum + task.taskTime, 0);
        setValue("totalTime", newTotalTime);
  
        // const newStatus = await calculateStatus();
        // setValue("status", newStatus);
        // setValue("progressPercentage", newStatus);
      } catch (error) {
        handleError(error);
        console.error("エラー:", error);
        if (axios.isAxiosError(error)) {
          console.log("サーバーレスポンス:", error.response?.data);
          console.log("リクエストデータ:", error.config?.data);
        }
      } finally {
        setIsLoading(false);
      }
  

      setChatResponse(parsedChatResponse);
      console.log("chatResponse:", chatResponse);
      await fetchGoals();
      // reset();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Axios error response:", error.response.data);
        setServerError(`エラー: ${error.response.data.message || 'Unknown error'}`);
      } else {
        console.error("Non-Axios error:", error);
        setServerError("未知のエラーが発生しました");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 日付が今日以降であることを確認する
   * @param {string} value - 検証する日付文字列
   * @returns {boolean | string} 検証結果またはエラーメッセージ
   */
  const validateDate = (value: string) => {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today || "開始日は今日以降の日付を選択してください";
  };

  /**
   * 日付入力の変更を処理し、必要に応じて今日の日付に設定する
   * @param {React.ChangeEvent<HTMLInputElement>} e - 日付入力変更イベント
   */
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

  /**
   * 選択された目標を設定し、関連するタスクを取得する
   * @param {Goal} goal - 選択された目標
   * @returns {Promise<void>}
   */
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
        console.log("Submitted goalId:", response);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setServerError("タスクの取得に失敗しました");
      }
    },
    [reset]
  );
  
  /**
   * 日付文字列をYYYY-MM-DD形式にフォーマットする
   * @param {string} dateString - フォーマットする日付文字列
   * @returns {string} フォーマットされた日付文字列
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  /**
   * 編集されたタスクをサーバーに保存する
   * @param {any} tasksToSave - 保存するタスク配列
   * @returns {Promise<void>}
   */
  const saveTasks = useCallback(
    async (tasksToSave: Task[]) => {
      if (!selectedGoal) {
        console.error("Selected goal is not set");
        setServerError("目標が選択されていません");
        return;
      }
      try {
        await axios.post(API_ENDPOINTS.SAVE_TASKS(selectedGoal.id), {
          tasks: tasksToSave,
          userId: localStorage.getItem("userId"),
        });
        setTasks(tasksToSave);
      } catch (error) {
        console.error("Failed to save tasks:", error);
        setServerError("タスクの保存に失敗しました");
      }
    },
    [selectedGoal, setServerError, setTasks]
  );
  

  /**
   * 指定されたIDの目標を削除する
   * @param {number | undefined} id - 削除する目標のID
   * @returns {Promise<void>}
   */
  const handleGoalDelete = async (id: number | undefined) => {
    if (id === undefined) {
      console.log("Goal ID is undefined");
      setServerError("目標の削除に失敗しました：IDが無効です");
      return;
    }
    try {
      await axios.delete(API_ENDPOINTS.DELETE_GOAL(id));
      setGoals(goals.filter((goal) => goal.id !== id));
      if (selectedGoal && selectedGoal.id === id) {
        setSelectedGoal(null);
        reset({});
      }
    } catch (error) {
      console.error("Failed to delete goal:", error);
      setServerError("目標の削除に失敗しました");
    }
  };

  /**
   * 指定されたIDの目標を削除し、状態を更新する
   * @param {number} id - 削除する目標のID
   * @returns {Promise<void>}
   */
  const onGoalDelete = async (id: number) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_GOAL(id));
      setGoals(goals.filter((goal) => goal.id !== id));
    } catch (error) {
      console.error("Failed to delete goal:", error);
      setServerError("目標の削除に失敗しました");
    }
  };

  /**
   * 指定された目標IDに対してチャットリクエストを送信する
   * @param {number} goalId - 目標ID
   * @param {string} message - 送信するメッセージ
   * @returns {Promise<any>} チャットレスポンス
   */
  const sendChatRequest = async (id: number, message: string) => {
    try {
      const response = await axios.post(
        `${API_ENDPOINTS.CHAT_GOAL(id)}`,
        { message },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Chat request failed:", error);
      throw error;
    }
  };
  /**
   * エラーを処理し、適切なエラーメッセージを設定する
   * @param {unknown} error - 処理するエラーオブジェクト
   */
  const handleError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;
      console.error("Axios エラー:", errorMessage);
      setServerError(errorMessage);
    } else if (error instanceof Error) {
      console.error("エラー:", error.message);
      setServerError(error.message);
    } else {
      console.error("未知のエラー:", error);
      setServerError("未知のエラーが発生しました");
    }
  };
  

  useEffect(() => {
    console.log("chatResponse updated:", chatResponse);
    if (chatResponse.length > 0) {
      const transformedTasks = chatResponse.map((task, index) => ({
        id: index + 1,
        name: String(task.taskName ?? ""),  // taskName を使用
        taskTime: task.taskTime ?? 0,  // taskTime を使用
        taskPriority: task.tasktaskPriority,  // tasktaskPriority を使用
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
    console.log("tasks updated:", tasks);
  }, [tasks]);
  
  useEffect(() => {
    if (chatResponse.length > 0 && tasks.length === 0) {
      setTasks(chatResponse);
    }
  }, [chatResponse, tasks]);


  /**
   * 指定された目標IDに関連するタスクを取得する
   * @param {number} id - 目標ID
   * @returns {Promise<void>}
   */
  useEffect(() => {
    if (selectedGoal) {
      fetchTasks(selectedGoal.id);
    }
  }, [selectedGoal]);

  const fetchTasks = async (goalId: number) => {
    try {
      const response = await axios.get(API_ENDPOINTS.GOAL_TASKS(goalId));
      console.log("Fetched tasks:", response.data);
      if (response.data && Array.isArray(response.data)) {
        setTasks(response.data);
      } else {
        console.error("Unexpected response format:", response.data);
        setServerError("タスクデータの形式が不正です");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setServerError("タスクの取得に失敗しました");
    }
  };
  // const fetchTasks = async (goalId: number) => {
  //   try {
  //     const response = await axios.get(API_ENDPOINTS.GOAL_TASKS(goalId));
  //     console.log("Fetched tasks:", response.data);
  //     if (response.data && Array.isArray(response.data)) {
  //       const transformedTasks = transformTasks(response.data);
  //       setTasks(transformedTasks);
  //       console.log("Transformed tasks:", transformedTasks);
  //     } else {
  //       console.error("Unexpected response format:", response.data);
  //       setServerError("タスクデータの形式が不正です");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching tasks:", error);
  //     setServerError("タスクの取得に失敗しました");
  //   }
  // };


  const handleEdit = (task: Task) => {
    if (!task || !task.id) {
      console.error("Invalid task object:", task);
      return;
    }
    setEditingId(task.id.toString());  // number を string に変換
    setEditedTask({ ...task });
  };
  
  const transformTasks = (tasks: any[]): Task[] => {
  return tasks.map((task, index) => ({
    id: index + 1,
    name: task.taskName,
    taskTime: task.taskTime,
    taskPriority: task.tasktaskPriority,
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
};
if (errorMessage) {
  return <div>{errorMessage}</div>;  // エラーメッセージを表示
}

if (!userId) {
  return <div>Loading...</div>;  // ユーザーIDがまだ取得されていない場合
}

  console.log("Validation errors:", errors);
  console.log("chatResponse:", chatResponse);

  return (
    <>
    <section className="section">
      <h1 className="h1">近い未来の目標</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
      <div className="my-5">
          <Label htmlFor="name" className="w-full block text-left">目標</Label>
          <Textarea
            id="name"
            {...register("name", { required: "目標名は必須です" })}
          />
          {errors.name && <p className="text-red-600 text-left">{errors.name.message}</p>}
        </div>

          <div className="my-5">
            <Label
              htmlFor="currentSituation"
              className="w-full block text-left"
            >
              現状
            </Label>
            <Input
              type="text"
              className=""
              id="currentStatus"
              {...register("currentStatus", {
                required: "現状は必須です",
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
                  key={task.id || index}
                  id={task.id}
                  task={task}
                  index={index}
                  editingId={editingId}
                  editedTask={editedTask}
                  handleEdit={handleEdit}
                  handleSave={handleSave}
                  handleChange={handleChange}
                  handleDeleteTask={handleDeleteTask}
                />
              ))}
          {/* {tasks.map((task, index) => (
        <SimpleSortableItem
          key={task.id || index}
          id={task.id} 
          task={task}
          index={index}
        />
      ))} */}
  </tbody>
</table>
</SortableContext>

) : (
  <p>タスクがありません。または読み込み中です。</p>
)}

</section>
<Link to="/goallist">
<Button>目標一覧を見る</Button>
</Link>
</>
);
};

export default Goal;
