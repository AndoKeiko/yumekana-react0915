"use client";
import React, { useState, useMemo, useCallback } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from 'date-fns';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import ScheduleComponent from './ScheduleComponent';

interface Task {
  id: string | number;
  name: string;
  taskName?: string;
  description?: string;
  estimated_time: number;
  taskTime?: number;
  priority: number;
  review_interval?: number;
  order: number;
  goalId?: number;
  goal_id?: number;
}

interface SortConfig {
  key: keyof Task | null;
  direction: 'ascending' | 'descending';
}

interface ScheduleConfig {
  hoursPerDay: number;
  startTime: string;
  startDate: string;
}

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  existingTasks: Task[];
  chatResponse: Task[];
  handleReflectSchedule: (tasks: Task[]) => void;
  goalName: string;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  setTasks,
  existingTasks,
  chatResponse,
  handleReflectSchedule,
  goalId,
}) => {
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    hoursPerDay: 8,
    startTime: "09:00",
    startDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [desiredGoalId, setDesiredGoalId] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const navigate = useNavigate();

  const combinedTasks = useMemo(() => {
    const allTasks = [...existingTasks, ...chatResponse];
    const uniqueTasks = allTasks.reduce((acc, current) => {
      const existingTask = acc.find(item => item.id === current.id);
      if (!existingTask) {
        return [...acc, { ...current, goalId: current.goal_id }];
      } else {
        return acc.map(item => item.id === current.id ? { ...item, ...current, goalId: current.goal_id } : item);
      }
    }, [] as Task[]);
    return uniqueTasks;
  }, [chatResponse, existingTasks]);

  const sortedTasks = useMemo(() => {
    let sortableTasks = [...combinedTasks];
    if (sortConfig.key !== null) {
      sortableTasks.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue == null || bValue == null) {
          return 0;
        }
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTasks;
  }, [combinedTasks, sortConfig]);

  const requestSort = (key: keyof Task) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleConfigChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setScheduleConfig(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEdit = useCallback((task: Task) => {
    setEditingId(task.id.toString());
    setEditedTask({ ...task });
  }, []);

  const handleSave = useCallback(async (id: string | number) => {
    if (editedTask) {
      try {
        const response = await axios.put(API_ENDPOINTS.UPDATE_TASK(goalId, Number(id)), editedTask);
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === id ? { ...task, ...response.data } : task
          )
        );
        setEditingId(null);
        setEditedTask(null);
      } catch (error) {
        console.error("Failed to update task:", error);
        setErrorMessage("タスクの更新に失敗しました");
      }
    }
  }, [editedTask, setTasks, goalId]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: keyof Task,
    taskId: string | number
  ) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, [field]: value } 
          : task
      )
    );
  }, [setTasks]);

  const handleUpdateElapsedTime = useCallback(async (taskId: string | number, elapsedTime: number) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_ELAPSED_TIME(goalId, Number(taskId)), { elapsed_time: elapsedTime });
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, elapsedTime: response.data.task.elapsed_time } : task
      ));
    } catch (error) {
      console.error("Failed to update elapsed time:", error);
      setErrorMessage("経過時間の更新に失敗しました");
    }
  }, [setTasks, goalId]);

  const handleUpdateReviewInterval = useCallback(async (taskId: string | number, reviewInterval: string) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_REVIEW_INTERVAL(goalId, Number(taskId)), { review_interval: reviewInterval });
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, reviewInterval: response.data.task.review_interval } : task
      ));
    } catch (error) {
      console.error("Failed to update review interval:", error);
      setErrorMessage("レビュー間隔の更新に失敗しました");
    }
  }, [setTasks, goalId]);

  const handleDeleteTask = useCallback(async (taskId: string | number) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_TASK(goalId, Number(taskId)));
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Failed to delete task:", error);
      setErrorMessage("タスクの削除に失敗しました");
    }
  }, [setTasks, goalId]);

  const handleSaveAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const updatedTasks = sortedTasks.map((task, index) => ({
        id: task.id,
        name: task.name || task.taskName,
        description: task.description,
        estimated_time: task.estimated_time || task.taskTime,
        priority: task.priority,
        review_interval: task.review_interval,
        order: index + 1,
        goal_id: task.goalId || task.goal_id,
      }));

      const goalId = updatedTasks[0]?.goal_id || updatedTasks[0]?.goalId || desiredGoalId;

      if (!goalId) {
        throw new Error("Goal ID が見つかりません");
      }

      const response = await axios.post(
        API_ENDPOINTS.SAVE_TASKS(goalId),
        { tasks: updatedTasks },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );

      if (response.status === 200) {
        console.log("タスクが正常に保存されました");
        setTasks(response.data.tasks);
      } else {
        throw new Error("タスクの保存に失敗しました");
      }
    } catch (error) {
      console.error("タスクの保存に失敗しました", error);
      setErrorMessage("タスクの保存に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [sortedTasks, setTasks, desiredGoalId]);

  const onReflectScheduleClick = useCallback(() => {
    const filteredTasks = sortedTasks.filter(task => task.goalId === Number(desiredGoalId));
    const orderedTasks = filteredTasks.sort((a, b) => a.order - b.order);
    handleReflectSchedule(orderedTasks);
  }, [sortedTasks, desiredGoalId, handleReflectSchedule]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        updateTaskOrder(newItems);
        return newItems;
      });
    }
  }, [setTasks]);

  const updateTaskOrder = async (newTasks) => {
    try {
      await axios.put(API_ENDPOINTS.UPDATE_TASK_ORDER(goalId), {
        tasks: newTasks.map((task, index) => ({ id: task.id, order: index + 1 }))
      });
    } catch (error) {
      console.error("Failed to update task order:", error);
      setErrorMessage("タスクの順序更新に失敗しました");
    }
  };

  // const SortableTaskItem = ({ task, index, editingId, handleChange, handleSave, handleEdit, handleDeleteTask, handleUpdateElapsedTime, handleUpdateReviewInterval }) => {
    // const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
    
    // const style = {
    //   transform: CSS.Transform.toString(transform),
    //   transition,
    // };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="border px-4 py-2">順序</th>
                <th className="border px-4 py-2">タスク名<button onClick={() => requestSort("name")}>▲▼</button></th>
                <th className="border px-4 py-2">所要時間<button onClick={() => requestSort("estimated_time")}>▲▼</button></th>
                <th className="border px-4 py-2">優先度<button onClick={() => requestSort("priority")}>▲▼</button></th>
                <th className="border px-4 py-2">経過時間</th>
                <th className="border px-4 py-2">レビュー間隔</th>
                <th className="border px-4 py-2">アクション</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks
                .filter(task => desiredGoalId === null || task.goalId === Number(desiredGoalId))
                .map((task, index) => {
                  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
                  
                  const style = {
                    transform: CSS.Transform.toString(transform),
                    transition,
                  };

                  return (
                    <tr key={task.id} ref={setNodeRef} style={style} {...attributes} {...listeners}>
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
                            value={(task.estimated_time || task.taskTime || '').toString()}
                            onChange={(e) => handleChange(e, "estimated_time", task.id)}
                            type="number"
                          />
                        ) : (
                          task.estimated_time || task.taskTime
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {editingId === task.id.toString() ? (
                          <select
                            value={String(task.priority)}
                            onChange={(e) => handleChange(e, "priority", task.id)}
                            className="w-full border rounded px-2 py-1"
                          >
                            <option value="1">低</option>
                            <option value="2">中</option>
                            <option value="3">高</option>
                          </select>
                        ) : task.priority === 1 ? (
                          "低"
                        ) : task.priority === 2 ? (
                          "中"
                        ) : (
                          "高"
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        <Input
                          type="number"
                          value={task.elapsedTime || 0}
                          onChange={(e) => handleUpdateElapsedTime(task.id, Number(e.target.value))}
                        />
                      </td>
                      <td className="border px-4 py-2">
                        <select
                          value={task.reviewInterval || 'next_day'}
                          onChange={(e) => handleUpdateReviewInterval(task.id, e.target.value)}
                          className="w-full border rounded px-2 py-1"
                        >
                          <option value="next_day">Next Day</option>
                          <option value="7_days">7 Days</option>
                          <option value="14_days">14 Days</option>
                          <option value="28_days">28 Days</option>
                          <option value="56_days">56 Days</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="border px-4 py-2">
                        {editingId === task.id.toString() ? (
                          <Button onClick={() => handleSave(task.id)}>保存</Button>
                        ) : (
                          <div className="flex space-x-2">
                            <Button onClick={() => handleEdit(task)}>編集</Button>
                            <Button onClick={() => handleDeleteTask(task.id)}>削除</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <div className="mt-6">
        <div className="flex justify-center gap-8">
          <div>
            <p className='inline-block'>1日の作業時間:</p>
            <Input
              type="number"
              name="hoursPerDay"
              value={scheduleConfig.hoursPerDay}
              onChange={handleConfigChange}
              placeholder="1日の作業時間"
              className="mr-4"
            />
          </div>
          <div>
            <p className='inline-block'>作業開始時間:</p>
            <Input
              type="time"
              name="startTime"
              value={scheduleConfig.startTime}
              onChange={handleConfigChange}
              className="mr-4"
            />
          </div>
          <div>
            <p className='inline-block'>作業開始日:</p>
            <Input
              type="date"
              name="startDate"
              value={scheduleConfig.startDate}
              onChange={handleConfigChange}
              className="mr-4"
            />
          </div>
        </div>
        <Button onClick={handleSaveAll} className="mt-6">全ての変更を保存</Button>
        <Button onClick={onReflectScheduleClick} className="mt-6 ml-4">スケジュールに反映</Button>
        <Button onClick={handleGoBack} className="mt-6 ml-4">戻る</Button>
      </div>
      {showSchedule && (
        <ScheduleComponent
          events={events}
          hoursPerDay={scheduleConfig.hoursPerDay}
          startTime={scheduleConfig.startTime}
          tasks={tasks}
        />
      )}
    </div>
  );
};

export default TaskList;