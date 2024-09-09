import React, { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SortableItem from './SortableItem';
import Schedule from './Schedule';
import type { Task } from "@/Types/index";
import moment from 'moment';
import axios, { AxiosError } from "axios";
import { useNavigate } from 'react-router-dom';

interface SortConfig {
  key: keyof Task | null;
  direction: 'ascending' | 'descending';
}

interface TaskListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onSaveTasks: (tasks: Task[]) => Promise<void>;
  existingTasks: Task[];
  chatResponse: Task[];
  handleDeleteTask: (id: string | number) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, setTasks, onSaveTasks, existingTasks, chatResponse }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [isLoading] = useState<boolean>(false);
  const [desiredGoalId, setDesiredGoalId] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAxiosError = (error: unknown): error is AxiosError => {
    return error instanceof Error && 'isAxiosError' in error;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const combinedTasks = useMemo(() => {
    const allTasks = [...existingTasks, ...chatResponse];
    const uniqueTasks = allTasks.reduce((acc, current) => {
      const x = acc.find(item => item.taskName === current.taskName);
      const taskWithGoalId = { ...current, goalId: current.goalId };
      if (!x) {
        return acc.concat([taskWithGoalId]);
      } else {
        return acc.map(item => item.taskName === current.taskName ? current : item);
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
          return 0; // null 値の場合は同じとみなす
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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          taskOrder: index + 1
        }));
      });
    }
  };
  const handleEdit = (task: Task) => {
    setEditingId(task.id.toString());  // 編集中のタスクIDを設定
    setEditedTask({ ...task }); // 編集するタスクをコピーして設定
  };

  const handleSave = (id: string | number) => { // 修正済み
    if (editedTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, ...editedTask } : task
        )
      );
    }
    setEditingId(null);
    setEditedTask(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, // 修正済み
    field: string // 修正済み
  ) => {
    if (editedTask) {
      setEditedTask({
        ...editedTask,
        [field]: e.target.value
      });
    }
  };

  const handleDeleteTask = (taskId: string | number) => {
    const updatedTasks = chatResponse.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
  };

  const handleSaveAll = async () => {
    try {
      setErrorMessage(null);
      const updatedTasks = tasks.map((task, index) => ({
        ...task,
        taskOrder: index + 1
      }));
      await onSaveTasks(updatedTasks);
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to save tasks:", error);
      if (isAxiosError(error) && error.response) {
        setErrorMessage("タスクの保存中にエラーが発生しました。");
      } else {
        setErrorMessage("予期せぬエラーが発生しました。");
      }
    }
  };
  const handleScheduleReflection = (tasks: Task[]) => {
    return tasks.map(task => ({
      taskId: task.id,
      date: moment().format('YYYY-MM-DD'),
      hours: 1 // 仮の値
    }));
  };

  const handleReflectSchedule = () => {
    const generatedSchedule = handleScheduleReflection(tasks);

    const calendarEvents = generatedSchedule.map((item: { taskId: string | number; date: string; hours: number }) => {
      const task = tasks.find(t => t.id === item.taskId);
      const startTime = moment(item.date).hour(9).toDate();
      const endTime = moment(startTime).add(item.hours, 'hours').toDate();

      return {
        title: task ? task.taskName : `Task ${item.taskId}`,
        start: startTime,
        end: endTime,
      };
    });

    setEvents(calendarEvents);
    console.log("Generated Calendar Events:", calendarEvents);
  };

  const handleGoBack = () => {
    navigate(-1); // 前のページに戻る
  };


  // ... (他の関数は変更なし)
  if (isLoading) {
    return <div>読み込み中...</div>;
  }
  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="border px-4 py-2">順序</th>
                <th className="border px-4 py-2">タスク名<button onClick={() => requestSort("taskName")}>▲▼</button></th>
                <th className="border px-4 py-2">所要時間<button onClick={() => requestSort("taskTime")}>▲▼</button></th>
                <th className="border px-4 py-2">優先度<button onClick={() => requestSort("taskPriority")}>▲▼</button></th>
                <th className="border px-4 py-2">アクション</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks
                .filter(task => desiredGoalId === null || task.goalId === Number(desiredGoalId))
                .map((task, index) => (
                  <SortableItem
                    key={task.id}
                    id={task.id}
                    task={task as Task}
                    index={index}
                    editingId={editingId}
                    editedTask={editedTask}
                    handleEdit={handleEdit}
                    handleSave={handleSave}
                    handleChange={handleChange}
                    handleDeleteTask={handleDeleteTask}
                    goalId={task.goalId}  // goalIdを追加
                  />
                ))}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button onClick={handleSaveAll} className="mt-6">全ての変更を保存</Button>
      <Button onClick={handleReflectSchedule} className="mt-6 ml-4">スケジュールに反映</Button>
      <Button onClick={handleGoBack} className="mt-6 ml-4">戻る</Button>

      {events.length > 0 && (
        <div className="mt-4">
          <h3>生成されたスケジュール:</h3>
          <Schedule events={events} />
        </div>
      )}
    </div>
  );
};

export default TaskList;