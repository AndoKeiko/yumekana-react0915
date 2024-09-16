import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_ENDPOINTS } from "@/config/api";
import TaskList from './TaskList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Task } from "@/Types/index";
import SortableItem from './SortableItem'; // SortableItemをインポート
import ScheduleComponent from './ScheduleComponent';
import moment from 'moment';

interface TaskListPageProps {
  onSaveTasks: (tasks: Task[]) => Promise<void>;
}

interface ScheduleConfig {
  hoursPerDay: number;
  startTime: string;
  startDate: string;
}
interface TasksResponse {
  tasks: Task[];
  goalName: string;
}

const TaskListPage: React.FC<TaskListPageProps> = ({ onSaveTasks }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { goalId } = useParams<{ goalId: string }>();
  const [goalName, setGoalName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [startTime, setStartTime] = useState<string>("09:00");

  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    hoursPerDay: 8,
    startTime: "09:00",
    startDate: new Date().toISOString().split('T')[0]
  });

  const [events, setEvents] = useState<any[]>([]);

  // handleReflectSchedule 関数を TaskListPage に移動
  // const handleReflectSchedule = () => {
  //   const generatedSchedule = generateSchedule(tasks, scheduleConfig);
  //   setShowSchedule(true);
  //   console.log("Generated Calendar Events:", generatedSchedule);
  // }

  const generateSchedule = (tasks: Task[], config: ScheduleConfig) => {
    console.log("Generating schedule with config:", config);
    console.log("Tasks to schedule:", tasks);

    let currentDate = moment(config.startDate).startOf('day');
    const schedule: any[] = [];

    tasks.forEach(task => {
      let remainingHours = parseFloat(task.estimated_time || task.taskTime || "0");
      while (remainingHours > 0) {
        const hoursToday = Math.min(remainingHours, config.hoursPerDay);
        const startTime = moment(`${currentDate.format('YYYY-MM-DD')} ${config.startTime}`, 'YYYY-MM-DD HH:mm');
        const endTime = moment(startTime).add(hoursToday, 'hours');

        schedule.push({
          title: task.name || task.taskName,
          start: startTime.toDate(),
          end: endTime.toDate(),
        });

        remainingHours -= hoursToday;
        currentDate = currentDate.add(1, 'day');
      }
    });

    console.log("Generated schedule:", schedule);
    return schedule;
  };


  const handleReflectSchedule = () => {
    const generatedSchedule = generateSchedule(tasks, scheduleConfig);
    setEvents(generatedSchedule);
    setShowSchedule(true);
    console.log("Generated Calendar Events:", generatedSchedule);
  };

  const handleDeleteTask = (id: string | number) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };

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
      const data = response.data as { tasks: Task[], goal_name: string };
      setTasks(data.tasks);
      setGoalName(data.goal_name);
      console.log(goalName);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setServerError("タスクの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleEdit = (task: Task) => {
    setEditingId(task.id.toString());
    setEditedTask({ ...task });
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
        [field]: field === "taskTime" || field === "taskPriority" ? Number(e.target.value) : e.target.value
      });
    }
  };

  const handleExportToSchedule = () => {
    setShowSchedule(true);
  };

  const handleCloseSchedule = () => {
    setShowSchedule(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='m-4'>
      <h1 className='h1'>タスクリスト: {goalName}</h1>
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      {!serverError && (
        <>
          <TaskList
            tasks={tasks}
            setTasks={setTasks}
            onSaveTasks={onSaveTasks}
            handleDeleteTask={handleDeleteTask}
            existingTasks={tasks}
            chatResponse={[]}
            goalName={goalName}
            scheduleConfig={scheduleConfig}
            setScheduleConfig={setScheduleConfig}
            handleReflectSchedule={handleReflectSchedule}
          />
          {showSchedule && (
            <div className="schedule-modal">
              <Button onClick={() => setShowSchedule(false)}>閉じる</Button>
              {console.log("eventsあああ", events)}
              {console.log("スケジュール設定:", { hoursPerDay, startTime })}
              <ScheduleComponent
                events={events}
                hoursPerDay={hoursPerDay}
                startTime={startTime}
                tasks={tasks}  // ここを追加
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default TaskListPage;