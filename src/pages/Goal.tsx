import React, { useState, useCallback, useEffect } from "react";
import { useUser } from '../hooks/useUser';
import { useForm } from "react-hook-form";
import axios from "axios";
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
import SortableItem from "./SortableItem";

//Goalコンポーネント
const Goal: React.FC = () => {
  //状態変数の定義
  const [serverError, setServerError] = useState<string | null>(null);
  const [response, setResponse] = useState<string>("");
  const [chatResponse, setChatResponse] = useState<Task[]>([]);
  // const memoizedChatResponse = useMemo(() => chatResponse, [chatResponse]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const { userId, setUserIdAction } = useUser();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalTime, setTotalTime] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<Goal>({
    mode: "onChange",
    defaultValues: {
      name: "",
      current_status: "",
      period_start: "",
      period_end: "",
      description: "",
      status: 0, // 初期値を0に設定
      total_time: 0,
      progress_percentage: 0,
    },
  });

  // 期間の開始日と終了日を監視
  const periodStart = watch("period_start");
  const periodEnd = watch("period_end");

  // 進捗状況を計算する関数
  const calculateStatus = useCallback(async () => {
    if (!periodStart || !periodEnd) return 0;

    try {
      // // バックエンドAPIを呼び出して学習記録を取得
      // const response = await axios.get(API_ENDPOINTS.DAILY_HISTORY(userId));
      // const dailyHistory = response.data;

      // // 学習記録から総学習時間を計算
      // const totalStudyTime = dailyHistory.reduce((sum, record) => sum + record.study_time, 0);

      // // 進捗率を計算（総学習時間 / 目標時間 * 100）
      // const progressPercentage = Math.min(Math.round((totalStudyTime / watch("total_time")) * 100), 100);

      // return progressPercentage;
      return 0;
    } catch (error) {
      console.error("Failed to fetch daily history:", error);
      return 0;
    }
  }, [periodStart, periodEnd, userId, watch]);

  // 期間が変更されたときに進捗状況を更新
  useEffect(() => {
    const updateStatus = async () => {
      const newStatus = await calculateStatus();
      setValue("status", newStatus);
      setValue("progress_percentage", newStatus);
    };
    updateStatus();
  }, [periodStart, periodEnd, calculateStatus, setValue]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchUserData = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.USER, { withCredentials: true });
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

  const handleSave = async (id: number) => {
    if (!editedTask) return;

    try {
      const response = await axios.put<Task>(API_ENDPOINTS.UPDATE_TASK(id), editedTask);
      const updatedTask: Task = response.data;
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === id ? { ...task, ...updatedTask } : task
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
    field: keyof Task
  ) => {
    if (editedTask) {
      setEditedTask({
        ...editedTask,
        [field]: field === "estimatedTime" || field === "priority" ? Number(e.target.value) : e.target.value
      });
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_TASK(id));
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
      setServerError("タスクの削除に失敗しました");
    }
  };






  /**
   * 新しい目標を作成し、AIを使用して関連タスクを生成する
   * @param {Goal} data - フォームから送信された目標データ
   * @returns {Promise<void>}
   */
  //onSubmit関数の定義
  const onSubmit = async (data: Goal) => {
    console.log("onSubmit関数が呼び出されました", data);
    console.log("Current userId:", userId);  // この行を追加
    if (!userId) {
      setServerError("ユーザーIDが見つかりません。ログインしてください。");
      return;
    }

    console.log("onSubmit関数が呼び出されました");
    //送信データの作成
    const submissionData = {
      ...data,
      name: data.name,
      user_id: Number(userId),
      goalId: selectedGoal?.id,
      description: data.description,
      estimated_time: data.estimated_time,
      priority: data.priority,
      period_start: data.period_start,
      period_end: data.period_end,
      current_status: data.current_status,
      status: data.status,
    };

    console.log("送信データ:", JSON.stringify(submissionData, null, 2));


    try {
      setIsLoading(true);
      setServerError(null);
      console.log("axios.postを呼び出します");
      const result: any = await axios.post(
        API_ENDPOINTS.CREATE_GOAL,
        submissionData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true, // CORSの問題を回避するために追加
        }
      );
      console.log("APIレスポンス:", result.data);
      setResponse(result.data.message);
      console.log(result.data.Goals.id);

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

        // 総時間を計算し、状態を更新
        const newTotalTime = parsedChatResponse.reduce((sum, task) => sum + task.estimatedTime, 0);
        setValue("total_time", newTotalTime);

        // 進捗状況を再計算
        const newStatus = await calculateStatus();
        setValue("status", newStatus);
        setValue("progress_percentage", newStatus);
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
      reset();
    } catch (error) {
      handleError(error);
      console.error("エラー:", error);
      setResponse("エラーが発生しました");
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
        name as "period_start" | "period_end",
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
        period_start: formatDate(goal.period_start),
        period_end: formatDate(goal.period_end),
      });

      try {
        const response = await axios.get(API_ENDPOINTS.GOAL_TASKS(goal.id));
        setTasks(response.data.tasks as Task[]);
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
      // await fetchGoals();
      setGoals(goals.filter((goal) => goal.id !== id));
      // onGoalDelete(id);
      if (selectedGoal && selectedGoal.id === id) {
        setSelectedGoal(null);
        reset({});
      }
    } catch (error) {
      console.error("Faile to delete goal:", error);
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
      console.error("Faile to delete goal:", error);
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
    if (error instanceof axios.AxiosError) {
      // Axios のエラーの場合
      const axiosError = error as AxiosError;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;
      console.error("Axios エラー:", errorMessage);
      setServerError(errorMessage);
    } else if (error instanceof Error) {
      // 一般的な Error オブジェクトの場合
      console.error("エラー:", error.message);
      setServerError(error.message);
    } else {
      // その他の未知のエラーの場合
      console.error("未知のエラー:", error);
      setServerError("未知のエラーが発生しました");
    }
  };


  useEffect(() => {
    console.log("chatResponse updated:", chatResponse);
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
  const fetchTasks = async (goalId: number) => {
    try {
      const response = await axios.get(API_ENDPOINTS.GOAL_TASKS(goalId));
      console.log("Fetched tasks:", response.data);
      if (response.data && Array.isArray(response.data)) {
        const transformedTasks = transformTasks(response.data);
        setTasks(transformedTasks);
        console.log("Transformed tasks:", transformedTasks);
      } else {
        console.error("Unexpected response format:", response.data);
        setServerError("タスクデータの形式が不正です");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setServerError("タスクの取得に失敗しました");
    }
  };


  const handleEdit = (task: Task) => {
    setEditingId(task.id.toString());  // number を string に変換
    setEditedTask({ ...task });
  };

  if (errorMessage) {
    return <div>{errorMessage}</div>;  // エラーメッセージを表示
  }

  if (!userId) {
    return <div>Loading...</div>;  // ユーザーIDがまだ取得されていない場合
  }

  const transformTasks = (tasks: any[]): Task[] => {
    return tasks.map((task, index) => ({
      id: index + 1, // 一意のIDを生成
      name: task.taskName,
      estimatedTime: task.taskTime,
      priority: task.taskPriority,
      order: index + 1
    }));
  };

  console.log("Validation errors:", errors);
  console.log("chatResponse:", chatResponse);

  return (
    <>
    <section className="section">
      <h1 className="h1">近い未来の目標</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
          <div className="my-5">
            <Label htmlFor="name" className="w-full block text-left">
              目標
            </Label>
            {/* <label htmlFor="goal" className="textleft w-full block text-left">目標</label> */}
            <Textarea
              className=""
              id="name"
              {...register("name", {
                required: "目標は必須です",
              })}
            />
            {errors.name && (
              <p className="text-red-600 text-left">
                {errors.name.message as React.ReactNode}
              </p>
            )}
            {console.log("Name field error:", errors.name)}
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
              id="current_status"
              {...register("current_status", {
                required: "現状は必須です",
              })}
            />
            {errors.current_status && (
              <p className="text-red-600 text-left">
                {errors.current_status.message as React.ReactNode}
              </p>
            )}
          </div>
          <div className="my-5">
            <Label
              htmlFor="period_start"
              className="textleft w-full block text-left"
            >
              目標期間（開始日）
            </Label>
            <Input
              id="period_start"
              className="my-2"
              type="date"
              {...register("period_start", {
                required: "目標期間の開始日は必須です",
                validate: validateDate,
              })}
              onChange={handleDateChange}
            />
            {errors.period_start && (
              <p className="text-red-600 text-left">
                {errors.period_start.message}
              </p>
            )}
          </div>
          <div className="my-5">
            <Label
              htmlFor="period_end"
              className="textleft w-full block text-left"
            >
              目標期間（修了日）
            </Label>
            <Input
              id="period_end"
              className="my-2"
              type="date"
              {...register("period_end", {
                required: "目標期間の終了日は必須です",
                validate: validateDate,
              })}
              onChange={handleDateChange}
            />
            {errors.period_end && (
              <p className="text-red-600 text-left">
                {errors.period_end.message}
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
            <Label htmlFor="status" className="w-full block text-left">
              進捗状況 (%)
            </Label>
            <Input
              type="number"
              id="status"
              {...register("status")}
              readOnly // ユーザーによる編集を防ぐ
            />
          </div>

          <div className="my-5">
            <Label htmlFor="total_time" className="w-full block text-left">
              総予定時間 (時間)
            </Label>
            <Input
              type="number"
              id="total_time"
              {...register("total_time")}
              readOnly // ユーザーによる編集を防ぐ
            />

            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="my-5">
            <Button type="submit" className="button" disabled={isLoading}>
              {isLoading ? "送信中..." : "目標を設定"}
            </Button>
          </div>
        </form>
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
              {tasks.map((task) => (
                <SortableItem
                  key={task.id || index}
                  id={task.id}
                  task={task}
                  index={task.order - 1}
                  editingId={editingId}
                  editedTask={editedTask}
                  handleEdit={handleEdit}
                  handleSave={handleSave}
                  handleChange={handleChange}
                  handleDeleteTask={handleDeleteTask}
                />
              ))}
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
