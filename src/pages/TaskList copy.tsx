import React, { useState, useMemo, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SortableItem from './SortableItem';
import type { Task } from "@/Types/index";
import moment from 'moment';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import ScheduleComponent from './ScheduleComponent';
import { format } from 'date-fns';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  onSaveTasks: (tasks: Task[]) => Promise<void>;
  existingTasks: Task[];
  chatResponse: Task[];
  handleReflectSchedule: (tasks: Task[]) => void;
  goalName: string;
  scheduleConfig: ScheduleConfig;
  setScheduleConfig: React.Dispatch<React.SetStateAction<ScheduleConfig>>;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  setTasks,
  existingTasks,
  chatResponse,
  handleReflectSchedule,
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


  const generateSchedule = (tasks: Task[], config: ScheduleConfig) => {
    const schedule: ScheduleItem[] = [];
    let currentDate = new Date(config.startDate);
    let remainingHoursForDay = config.hoursPerDay;

    tasks.forEach(task => {
      let remainingTaskTime = task.taskTime || 0;

      while (remainingTaskTime > 0) {
        const hoursToSchedule = Math.min(remainingTaskTime, remainingHoursForDay);

        schedule.push({
          taskId: task.id,
          date: format(currentDate, 'yyyy-MM-dd'),
          hours: hoursToSchedule
        });

        remainingTaskTime -= hoursToSchedule;
        remainingHoursForDay -= hoursToSchedule;

        if (remainingHoursForDay === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
          remainingHoursForDay = config.hoursPerDay;
        }
      }
    });

    return schedule;
  }

  // const generatedSchedule = generateSchedule(orderedTasks, scheduleConfig);

  // const onReflectScheduleClick = useCallback(() => {
  //   if (handleReflectSchedule) {
  //     const filteredTasks = sortedTasks.filter(task => task.goalId === Number(desiredGoalId));
  //     const orderedTasks = filteredTasks.sort((a, b) => a.order - b.order);
  //     handleReflectSchedule(orderedTasks);
  //   } else {
  //     console.error('handleReflectSchedule is not defined');
  //   }
  // }, [handleReflectSchedule, sortedTasks, desiredGoalId]);


  const isAxiosError = (error: unknown): error is AxiosError => {
    return error instanceof Error && 'isAxiosError' in error;
  };

  // const sensors = useSensors(
  //   useSensor(PointerSensor),
  //   useSensor(KeyboardSensor, {
  //     coordinateGetter: sortableKeyboardCoordinates,
  //   })
  // );

  const handleConfigChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setScheduleConfig(prev => ({ ...prev, [name]: value }));
  }, []);

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
    setTasks((prevTasks) => {
      const sortedTasks = [...prevTasks].sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        if (aValue == null || bValue == null) {
          return 0; // null 値の場合は同じとみなす
        }
        if (aValue < bValue) {
          return direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
      return sortedTasks.map((item, index) => ({
        ...item,
        taskOrder: index + 1
      }));
    });
  };

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({
          ...item,
          taskOrder: index + 1
        }));
      });
    }
  }, [setTasks]);


  const handleEdit = useCallback((task: Task) => {
    setEditingId(task.id.toString());
    setEditedTask({ ...task });
  }, []);

  const handleSave = useCallback((id: string | number) => {
    if (editedTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id ? { ...task, ...editedTask } : task
        )
      );
    }
    setEditingId(null);
    setEditedTask(null);
  }, [editedTask, setTasks]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    field: string,
    taskId: string | number
  ) => {
    if (editedTask) {
      const value = e.target.value;
      setEditedTask((prevTask) => {
        // if (!prevTask) return null;
        if (!prevTask || prevTask.id !== taskId) return prevTask;
        // taskNameまたはnameが変更された場合の処理
        if (field === "taskName" || field === "name") {
          return {
            ...prevTask,
            taskName: field === "taskName" ? value : prevTask.taskName,
            name: field === "name" ? value : prevTask.name,
          };
        }

        // taskTimeまたはestimated_timeが変更された場合の処理
        if (field === "taskTime" || field === "estimated_time") {
          return {
            ...prevTask,
            taskTime: field === "taskTime" ? value : prevTask.taskTime,
            estimated_time: field === "estimated_time" ? value : prevTask.estimated_time,
          };
        }

        // その他のフィールドの処理
        return {
          ...prevTask,
          [field]: value,
        };
      });
    }
  }, [editedTask]);

  const onSaveTasks = async () => {
    try {
      await axios.post(API_ENDPOINTS.SAVE_TASKS(goalId), { tasks }, { withCredentials: true });
      console.log("タスクが保存されました");
    } catch (error) {
      console.error("タスクの保存に失敗しました", error);
      setError("タスクの保存に失敗しました");
    }
  };

  const handleDeleteTask = useCallback((taskId: string | number) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, [setTasks]);

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

      console.log("Sending data:", { tasks: updatedTasks, goalId });

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

      console.log("Server response:", response.data);

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
  }, [sortedTasks, setTasks]);

  // const handleScheduleReflection = (tasks: Task[]) => {
  //   return tasks.map(task => ({
  //     taskId: task.id,
  //     date: moment().format('YYYY-MM-DD'),
  //     hours: 1 // 仮の値
  //   }));
  // };



  const onReflectScheduleClick = useCallback(() => {
    const filteredTasks = sortedTasks.filter(task => task.goalId === Number(desiredGoalId));
    const orderedTasks = filteredTasks.sort((a, b) => a.order - b.order);
    handleReflectSchedule(orderedTasks);
  }, [sortedTasks, desiredGoalId, handleReflectSchedule]);

  // const generatedSchedule = useMemo(() => {
  //   const filteredTasks = sortedTasks.filter(task => task.goalId === Number(desiredGoalId));
  //   const orderedTasks = filteredTasks.sort((a, b) => a.order - b.order);
  //   return generateSchedule(orderedTasks, scheduleConfig);
  // }, [sortedTasks, desiredGoalId, scheduleConfig]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  console.log("existingTasks:", existingTasks);
  console.log("chatResponse:", chatResponse);
  console.log("combinedTasks:", combinedTasks);
  console.log("sortedTasks:", sortedTasks);
  console.log("Number of tasks to render:", sortedTasks.length);
  console.log("desiredGoalId:", desiredGoalId);
  console.log("Filtered tasks:", sortedTasks.filter(task => desiredGoalId === null || task.goalId === Number(desiredGoalId)));
  console.log("sortConfig:", sortConfig);
  console.log("Current scheduleConfig:", scheduleConfig);
  console.log("Current events:", events);
  console.log("showSchedule:", showSchedule);
  // ... (他の関数は変更なし)
  if (isLoading) {
    return <div>読み込み中...</div>;
  }
  return (
    <div>
      {/* <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      > */}
        <SortableContext
          items={sortedTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="border px-4 py-2">順序</th>
                <th className="border px-4 py-2">タスク名<button onClick={() => requestSort("name")}>▲▼</button></th>
                <th className="border px-4 py-2">所要時間<button onClick={() => requestSort("estimated_time")}>▲▼</button></th>
                <th className="border px-4 py-2">優先度<button onClick={() => requestSort("priority")}>▲▼</button></th>
                <th className="border px-4 py-2">アクション</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks
                .filter(task => desiredGoalId === null || task.goalId === Number(desiredGoalId))
                .map((task, index) => (
                  <SortableItem
                  key={task.id}
                  task={task}
                  index={index}
                  handleEditClick={() => console.log(`Editing task: ${task.id}`)}
                  handleDeleteTask={() => handleDeleteTask(task.id)}
                  handleSave={(updatedTask) => handleSave(task.id, updatedTask)}
                  handleChange={(e, field) => handleChange(e, field, task.id)}
                />
                ))}
            </tbody>
          </table>
        </SortableContext>
      {/* </DndContext> */}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <div className="mt-6">
        <div className="flex justify-center gap-8">
          <div><p className='inline-block'>1日の作業時間:</p>
            <Input
              type="number"
              name="hoursPerDay"
              value={scheduleConfig.hoursPerDay}
              onChange={handleConfigChange}
              placeholder="1日の作業時間"
              className="mr-4"
            /></div>
          <div>
            <p className='inline-block'>作業開始時間:</p>
            <Input
              type="time"
              name="startTime"
              value={scheduleConfig.startTime}
              onChange={handleConfigChange}
              className="mr-4"
            /></div>
          <div><p className='inline-block'>作業開始日:</p>
            <Input
              type="date"
              name="startDate"
              value={scheduleConfig.startDate}
              onChange={handleConfigChange}
              className="mr-4"
            /></div></div>
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